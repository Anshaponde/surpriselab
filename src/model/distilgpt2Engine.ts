import {
  AutoModelForCausalLM,
  AutoTokenizer,
  env,
  Tensor,
  type PreTrainedModel,
  type PreTrainedTokenizer,
  type ProgressInfo,
} from '@huggingface/transformers';

export interface ModelTokenResult {
  index: number;
  tokenId: number;
  token: string;
  displayToken: string;
  prob: number;
  invProb: number;
  nllNats: number;
  nllBits: number;
}

export interface NextTokenPrediction {
  tokenId: number;
  token: string;
  displayToken: string;
  prob: number;
}

export interface ModelEvaluationResult {
  text: string;
  tokens: ModelTokenResult[];
  perplexity: number;
  crossEntropyNats: number;
  crossEntropyBits: number;
  nextTokenPredictions: NextTokenPrediction[];
  elapsedMs: number;
}

export interface LoadProgressState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  percent: number;
  loadedBytes: number;
  totalBytes: number;
  currentFile: string;
  message: string;
}

const MODEL_ID = 'Xenova/distilgpt2';

let cachedTokenizer: PreTrainedTokenizer | null = null;
let cachedModel: PreTrainedModel | null = null;
let loadPromise: Promise<{ tokenizer: PreTrainedTokenizer; model: PreTrainedModel }> | null = null;

function formatTokenVisual(raw: string): string {
  return raw.replace(/\n/g, '↵').replace(/^\s/, '·');
}

export function isModelLoaded(): boolean {
  return cachedTokenizer !== null && cachedModel !== null;
}

export async function ensureDistilGpt2Loaded(
  onProgress?: (state: LoadProgressState) => void,
): Promise<{ tokenizer: PreTrainedTokenizer; model: PreTrainedModel }> {
  if (cachedTokenizer && cachedModel) {
    onProgress?.({
      status: 'ready',
      percent: 100,
      loadedBytes: 0,
      totalBytes: 0,
      currentFile: 'Cached in browser',
      message: 'DistilGPT-2 ready (cached)',
    });
    return { tokenizer: cachedTokenizer, model: cachedModel };
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    env.allowLocalModels = false;
    env.useBrowserCache = true;

    const fileMap = new Map<string, { loaded: number; total: number }>();

    const emitProgress = (info: ProgressInfo) => {
      if (info.status === 'initiate' || info.status === 'download') {
        const key = info.file || info.name;
        if (!fileMap.has(key)) {
          fileMap.set(key, { loaded: 0, total: 0 });
        }
        onProgress?.({
          status: 'loading',
          percent: computeAggregatePercent(fileMap),
          loadedBytes: sumField(fileMap, 'loaded'),
          totalBytes: sumField(fileMap, 'total'),
          currentFile: info.file || 'model file',
          message: `Fetching ${info.file || 'weights'}…`,
        });
      } else if (info.status === 'progress') {
        const key = info.file || info.name;
        fileMap.set(key, { loaded: info.loaded ?? 0, total: info.total ?? 0 });
        const loaded = sumField(fileMap, 'loaded');
        const total = sumField(fileMap, 'total');
        const pct = total > 0 ? Math.min(99, (loaded / total) * 100) : info.progress ?? 0;
        onProgress?.({
          status: 'loading',
          percent: pct,
          loadedBytes: loaded,
          totalBytes: total,
          currentFile: info.file || 'model weights',
          message: `Downloading ${info.file || 'model'}…`,
        });
      } else if (info.status === 'progress_total') {
        onProgress?.({
          status: 'loading',
          percent: Math.min(99, info.progress ?? 0),
          loadedBytes: info.loaded ?? 0,
          totalBytes: info.total ?? 0,
          currentFile: 'DistilGPT-2 ONNX',
          message: 'Downloading quantized ONNX weights…',
        });
      } else if (info.status === 'done') {
        const key = info.file || info.name;
        const prev = fileMap.get(key);
        if (prev && prev.total > 0) {
          fileMap.set(key, { loaded: prev.total, total: prev.total });
        }
        onProgress?.({
          status: 'loading',
          percent: computeAggregatePercent(fileMap),
          loadedBytes: sumField(fileMap, 'loaded'),
          totalBytes: sumField(fileMap, 'total'),
          currentFile: info.file || 'file',
          message: `Loaded ${info.file || 'component'}`,
        });
      }
    };

    const tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID, {
      progress_callback: emitProgress,
    });

    const model = await AutoModelForCausalLM.from_pretrained(MODEL_ID, {
      dtype: 'q8',
      device: 'wasm',
      progress_callback: emitProgress,
    });

    cachedTokenizer = tokenizer;
    cachedModel = model;

    onProgress?.({
      status: 'ready',
      percent: 100,
      loadedBytes: sumField(fileMap, 'loaded'),
      totalBytes: sumField(fileMap, 'total'),
      currentFile: 'DistilGPT-2 (q8 WASM)',
      message: 'DistilGPT-2 loaded & cached in browser',
    });

    return { tokenizer, model };
  })();

  try {
    return await loadPromise;
  } catch (err) {
    loadPromise = null;
    throw err;
  }
}

function sumField(
  map: Map<string, { loaded: number; total: number }>,
  key: 'loaded' | 'total',
): number {
  let acc = 0;
  for (const item of map.values()) {
    acc += item[key];
  }
  return acc;
}

function computeAggregatePercent(
  map: Map<string, { loaded: number; total: number }>,
): number {
  const loaded = sumField(map, 'loaded');
  const total = sumField(map, 'total');
  if (total <= 0) return 5;
  return Math.min(99, (loaded / total) * 100);
}

function logSoftmaxAtOffset(
  data: Float32Array | number[],
  offset: number,
  vocabSize: number,
): { maxLogit: number; logZ: number } {
  let maxLogit = -Infinity;
  for (let v = 0; v < vocabSize; v++) {
    const val = Number(data[offset + v]);
    if (val > maxLogit) maxLogit = val;
  }
  let sumExp = 0;
  for (let v = 0; v < vocabSize; v++) {
    sumExp += Math.exp(Number(data[offset + v]) - maxLogit);
  }
  const logZ = maxLogit + Math.log(sumExp);
  return { maxLogit, logZ };
}

export async function evaluateTextWithDistilGpt2(
  text: string,
  onProgress?: (state: LoadProgressState) => void,
): Promise<ModelEvaluationResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Please enter a non-empty sentence to evaluate.');
  }

  const { tokenizer, model } = await ensureDistilGpt2Loaded(onProgress);
  const t0 = performance.now();

  const rawIds = tokenizer.encode(trimmed, { add_special_tokens: false });
  const encodedIds = rawIds.slice(0, 128);
  if (encodedIds.length === 0) {
    throw new Error('Could not tokenize the entered text.');
  }

  // Prepend <|endoftext|> (50256) so every user token has a genuine left-context distribution
  const bosId = typeof tokenizer.bos_token_id === 'number' ? tokenizer.bos_token_id : 50256;
  const fullIds = [bosId, ...encodedIds];
  const seqLen = fullIds.length;

  const inputIdsTensor = new Tensor(
    'int64',
    BigInt64Array.from(fullIds.map((id) => BigInt(id))),
    [1, seqLen],
  );
  const attentionMaskTensor = new Tensor(
    'int64',
    new BigInt64Array(seqLen).fill(1n),
    [1, seqLen],
  );

  const output = await model({
    input_ids: inputIdsTensor,
    attention_mask: attentionMaskTensor,
  });

  const logitsTensor = output.logits as Tensor;
  const dims = logitsTensor.dims;
  const vocabSize = dims[dims.length - 1];
  const logitsData = logitsTensor.data as Float32Array;

  const tokens: ModelTokenResult[] = [];
  let sumNllNats = 0;
  let sumNllBits = 0;

  for (let i = 0; i < encodedIds.length; i++) {
    const targetId = encodedIds[i];
    // Position i predicts fullIds[i + 1] === encodedIds[i]
    const offset = i * vocabSize;
    const { logZ } = logSoftmaxAtOffset(logitsData, offset, vocabSize);
    const logProb = Number(logitsData[offset + targetId]) - logZ;
    const prob = Math.max(1e-12, Math.exp(logProb));
    const nllNats = -logProb;
    const nllBits = nllNats / Math.LN2;
    const decoded = tokenizer.decode([targetId], {
      skip_special_tokens: false,
      clean_up_tokenization_spaces: false,
    });

    sumNllNats += nllNats;
    sumNllBits += nllBits;

    tokens.push({
      index: i,
      tokenId: targetId,
      token: decoded,
      displayToken: formatTokenVisual(decoded),
      prob,
      invProb: 1 / prob,
      nllNats,
      nllBits,
    });
  }

  // Top 8 next-token predictions from the final position (seqLen - 1)
  const lastOffset = (seqLen - 1) * vocabSize;
  const { logZ: lastLogZ } = logSoftmaxAtOffset(logitsData, lastOffset, vocabSize);

  const topK: { id: number; logit: number }[] = [];
  for (let v = 0; v < vocabSize; v++) {
    const logit = Number(logitsData[lastOffset + v]);
    if (topK.length < 8) {
      topK.push({ id: v, logit });
      topK.sort((a, b) => b.logit - a.logit);
    } else if (logit > topK[7].logit) {
      topK[7] = { id: v, logit };
      topK.sort((a, b) => b.logit - a.logit);
    }
  }

  const nextTokenPredictions: NextTokenPrediction[] = topK.map((entry) => {
    const prob = Math.exp(entry.logit - lastLogZ);
    const decoded = tokenizer.decode([entry.id], {
      skip_special_tokens: false,
      clean_up_tokenization_spaces: false,
    });
    return {
      tokenId: entry.id,
      token: decoded,
      displayToken: formatTokenVisual(decoded),
      prob,
    };
  });

  const crossEntropyNats = sumNllNats / tokens.length;
  const crossEntropyBits = sumNllBits / tokens.length;
  const perplexity = Math.exp(crossEntropyNats);
  const elapsedMs = Math.round(performance.now() - t0);

  return {
    text: trimmed,
    tokens,
    perplexity,
    crossEntropyNats,
    crossEntropyBits,
    nextTokenPredictions,
    elapsedMs,
  };
}
