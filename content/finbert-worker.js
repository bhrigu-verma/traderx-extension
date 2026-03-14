// ============================================================================
// TRADERX FINBERT WEB WORKER — Off-thread Financial ML Inference
// ============================================================================
// Runs FinBERT sentiment analysis in a dedicated worker thread so it
// never freezes the main UI thread.
//
// Model: ProsusAI/finbert (via Xenova/transformers.js quantized port)
// Trained on: Financial PhraseBank + financial news — understands terms
// like "support level", "oversold", "HODL", "capitulation", "breakout"
// correctly — unlike SST-2 which was trained on movie reviews.
//
// Labels returned by this model:
//   "positive"  → bullish signal   → score mapped to  [0,  1]
//   "negative"  → bearish signal   → score mapped to [-1,  0]
//   "neutral"   → no clear signal  → score mapped to   0
// ============================================================================

let classifier = null;
let isReady = false;
let isLoading = false;

// ============================================================================
// MODEL LOADER
// ============================================================================

async function loadModel() {
  if (isLoading || isReady) return;
  isLoading = true;

  try {
    // Load Transformers.js from CDN (allowed via manifest content_security_policy)
    importScripts(
      "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js",
    );

    // The global is exposed as Transformers after importScripts
    const { pipeline, env } = self.Transformers || self;

    // Disable local model loading — we always fetch from HuggingFace CDN
    if (env) {
      env.allowLocalModels = false;
      env.useBrowserCache = true; // Cache the model weights in browser IndexedDB
      env.backends = { onnx: { wasm: { proxy: false } } };
    }

    console.log("[FinBERT Worker] Loading ProsusAI/finbert (quantized)...");

    // ProsusAI/finbert — financial-domain sentiment, not movie reviews
    // The Xenova port is quantized (int8 ONNX) so it's ~50MB instead of ~440MB
    classifier = await pipeline(
      "text-classification",
      "Xenova/finbert", // quantized FinBERT on HuggingFace Hub
      {
        quantized: true, // Use int8 weights (smaller + faster)
        progress_callback: (progress) => {
          if (progress.status === "downloading") {
            self.postMessage({
              type: "progress",
              file: progress.file,
              loaded: progress.loaded,
              total: progress.total,
              pct:
                progress.total > 0
                  ? Math.round((progress.loaded / progress.total) * 100)
                  : 0,
            });
          }
        },
      },
    );

    isReady = true;
    isLoading = false;
    console.log("[FinBERT Worker] ProsusAI/finbert loaded successfully ✓");
    self.postMessage({ type: "ready", model: "Xenova/finbert" });
  } catch (error) {
    isLoading = false;
    console.error("[FinBERT Worker] Failed to load finbert:", error);

    // Try fallback: distilroberta-base-sentiment (financial text, smaller)
    try {
      console.warn("[FinBERT Worker] Trying fallback model...");
      const { pipeline, env } = self.Transformers || self;
      if (env) {
        env.allowLocalModels = false;
        env.useBrowserCache = true;
      }

      classifier = await pipeline(
        "sentiment-analysis",
        "Xenova/distilbert-base-uncased-finetuned-sst-2-english",
        { quantized: true },
      );

      isReady = true;
      isLoading = false;
      console.warn(
        "[FinBERT Worker] Fallback model loaded (SST-2 — reduced accuracy for financial text)",
      );
      self.postMessage({
        type: "ready",
        model: "fallback-sst2",
        warning: "Using fallback model — financial accuracy reduced",
      });
    } catch (fallbackError) {
      console.error("[FinBERT Worker] All models failed:", fallbackError);
      self.postMessage({ type: "error", error: fallbackError.message });
    }
  }
}

// ============================================================================
// INFERENCE HANDLER
// ============================================================================

self.onmessage = async function (event) {
  const { id, text, type } = event.data;

  // Handle explicit reload requests
  if (type === "reload") {
    isReady = false;
    isLoading = false;
    classifier = null;
    await loadModel();
    return;
  }

  // Guard: model must be loaded
  if (!isReady || !classifier) {
    self.postMessage({
      id,
      error: "Model not ready. Waiting for FinBERT to load...",
      code: "MODEL_NOT_READY",
    });
    return;
  }

  if (!text || typeof text !== "string") {
    self.postMessage({ id, error: "No text provided", code: "INVALID_INPUT" });
    return;
  }

  try {
    // FinBERT max token length is 512 subwords.
    // We truncate at ~400 characters as a safe character-level proxy,
    // keeping the most signal-dense beginning of the tweet/post.
    const truncated = text.substring(0, 400).trim();

    const results = await classifier(truncated, { topk: null }); // get all label scores

    // ----------------------------------------------------------------
    // Map FinBERT's 3-class output to a continuous sentiment score
    //   positive → bullish  → +score
    //   negative → bearish  → -score
    //   neutral  → no signal →  0
    //
    // We use a *weighted* approach instead of just taking the top label:
    //   finalScore = P(positive) * pos_score - P(negative) * neg_score
    // This produces nuanced values like +0.3 (mildly bullish) instead
    // of binary +1 / -1 jumps.
    // ----------------------------------------------------------------

    let positiveScore = 0;
    let negativeScore = 0;
    let neutralScore = 0;

    if (Array.isArray(results)) {
      results.forEach((r) => {
        const label = (r.label || "").toLowerCase();
        if (label.includes("positive")) positiveScore = r.score;
        else if (label.includes("negative")) negativeScore = r.score;
        else if (label.includes("neutral")) neutralScore = r.score;
      });
    } else {
      // Single result object (fallback model shape)
      const label = (results.label || "").toLowerCase();
      const score = results.score || 0;
      if (label.includes("positive")) positiveScore = score;
      else if (label.includes("negative")) negativeScore = score;
    }

    // Weighted continuous score in [-1, 1]
    // Neutral contribution dampens the extremes but doesn't eliminate them.
    const rawScore = positiveScore - negativeScore;

    // Confidence: how certain the model is overall
    // (1 - neutral score gives a measure of directional conviction)
    const confidence = 1 - neutralScore;

    // Scale by confidence: very neutral tweets get pulled toward 0
    const sentimentScore = rawScore * (0.5 + 0.5 * confidence);

    // Clamp to [-1, 1] just in case floating-point arithmetic drifts
    const finalScore = Math.max(-1, Math.min(1, sentimentScore));

    self.postMessage({
      id,
      result: finalScore,
      raw: {
        positive: positiveScore,
        negative: negativeScore,
        neutral: neutralScore,
        confidence,
      },
      model: "finbert",
    });
  } catch (inferenceError) {
    console.error("[FinBERT Worker] Inference error:", inferenceError);
    self.postMessage({
      id,
      error: inferenceError.message,
      code: "INFERENCE_ERROR",
    });
  }
};

// ============================================================================
// AUTO-LOAD ON WORKER CREATION
// ============================================================================

loadModel();
