# SurpriseLab

An interactive, 100% client-side educational lab for exploring **language-model perplexity**, token-level cross-entropy, and live in-browser neural language modeling.

## How Perplexity Works (in 3 lines)
1. A language model predicts each next token with conditional probability $P(w_i \mid w_{<i})$.
2. Taking the average negative log-probability gives **cross-entropy** $H$, measuring average surprise per token.
3. Exponentiating cross-entropy ($\mathrm{PPL} = e^H$) converts surprise into the effective number of equally likely words the model is hesitating between.

## Features
- **Live Metrics Dashboard**: Real-time Perplexity (PPL), cross-entropy in nats & bits/token, sequence joint probability and its inverse, average confidence ($1/\mathrm{PPL}$), token count, and most surprising token.
- **Probability Playground**: Enter any sentence, pick initial probability profiles (`Even 0.5`, `High 0.8`, `Uniform 1/N`, `Smart gradient`), fine-tune per-token sliders or numeric inputs in probability or percentage mode, add/remove tokens, import word/probability lists, inspect a token surprise heatmap, trace probability vs. surprise bits on a Recharts chart, and follow a live step-by-step arithmetic breakdown.
- **Real AI Model (DistilGPT-2)**: Lazy-loaded `@huggingface/transformers` ONNX/WebAssembly runner (`Xenova/distilgpt2`, quantized ~30 MB download cached in the browser) with per-token `P`, `1/P`, and `NLL` tables, top-8 next-token softmax bars, quick-test chips, and one-click **"Load into Playground"**.
- **Mathematics of Perplexity**: KaTeX walkthrough covering the geometric mean of inverse probabilities, cross-entropy equivalence, and the uniform-vocabulary intuition with a rough PPL scale.
- **Aurora Theme**: Dark aurora navy/teal/lime/amber glassmorphism UI with light/dark mode toggle, Sora/Inter/JetBrains Mono typography, animated count-up metrics, and keyboard-accessible controls.

## Local Setup

```bash
npm install
npm run dev
```

To create a production build:

```bash
npm run build
npm run preview
```

## Deploy (Zero Backend)

SurpriseLab builds to a static `dist/` folder with relative asset paths (`base: './'`).

- **Vercel**: Import the GitHub repository; Vite is auto-detected (`npm run build` → `dist`).
- **GitHub Pages**: Build `npm run build` and publish `dist/` via GitHub Actions or `gh-pages`.
