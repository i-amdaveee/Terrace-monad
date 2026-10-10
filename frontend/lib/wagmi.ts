import { createConfig, http } from "wagmi";
import { defineChain } from "viem";

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet-rpc.monad.xyz"] } },
  blockExplorers: { default: { name: "MonadVision", url: "https://testnet.monadvision.com" } },
  testnet: true,
});

// No fixed wallet: wagmi finds every installed wallet (MetaMask, OKX, Rabby...)
// and the Connect button lets the user pick one.
export const config = createConfig({
  chains: [monadTestnet],
  connectors: [],
  transports: { [monadTestnet.id]: http() },
  ssr: true,
});
