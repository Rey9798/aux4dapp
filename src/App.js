
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import toast, { Toaster } from "react-hot-toast";

const AUX_CONTRACT_ADDRESS = "0x83ff3Cd4b280eC4aB76c508A110bfa073AC3caE8";
const AUX_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint amount) returns (bool)",
  "function mint(address to, uint256 amount)",
  "function burn(uint256 amount)",
  "function decimals() view returns (uint8)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function rate() view returns (uint256)"
];

export default function AuxApp() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState(null);
  const [owner, setOwner] = useState(null);
  const [balance, setBalance] = useState(null);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [mintAmount, setMintAmount] = useState("");
  const [burnAmount, setBurnAmount] = useState("");
  const [ethAmount, setEthAmount] = useState("");
  const [estimatedAUX, setEstimatedAUX] = useState("");
  const [symbol, setSymbol] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [decimals, setDecimals] = useState(18);
  const [rate, setRate] = useState(1000);
  const [network, setNetwork] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("aux_tx_history");
    return saved ? JSON.parse(saved) : [];
  });

  const updateHistory = (newEntry) => {
    const updated = [newEntry, ...history];
    setHistory(updated);
    localStorage.setItem("aux_tx_history", JSON.stringify(updated));
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      const prov = new ethers.BrowserProvider(window.ethereum);
      await prov.send("eth_requestAccounts", []);
      const signer = await prov.getSigner();
      const addr = await signer.getAddress();
      const net = await prov.getNetwork();
      setProvider(prov);
      setSigner(signer);
      setAddress(addr);
      setNetwork(net.name);
      toast.success("Wallet conectada ✅");
    }
  };

  const loadContractInfo = async () => {
    const aux = new ethers.Contract(AUX_CONTRACT_ADDRESS, AUX_ABI, provider);
    const sym = await aux.symbol();
    const dec = await aux.decimals();
    const name = await aux.name();
    const rate = await aux.rate();
    const bal = await aux.balanceOf(address);
    const owner = await aux.owner();
    setSymbol(sym);
    setDecimals(dec);
    setTokenName(name);
    setRate(rate);
    setOwner(owner);
    setBalance(Number(ethers.formatUnits(bal, dec)));
  };

  useEffect(() => {
    if (signer) loadContractInfo();
  }, [signer]);

  const validateInput = (value) => value && parseFloat(value) > 0;

  const handleEthChange = (e) => {
    setEthAmount(e.target.value);
    const est = parseFloat(e.target.value || "0") * Number(rate);
    setEstimatedAUX(est.toFixed(2));
  };

  const exportHistory = () => {
    const content = history.map(h => `${h.timestamp} - ${h.type}: ${h.details}`).join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "aux_historial.txt";
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <Toaster />
      <div className="max-w-xl mx-auto space-y-6">
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">ℹ️ Estado del contrato</h2>
          <p><strong>Token:</strong> {tokenName} ({symbol})</p>
          <p><strong>Dirección:</strong> {AUX_CONTRACT_ADDRESS}</p>
          <p><strong>Dueño:</strong> {owner}</p>
          <p><strong>Rate:</strong> 1 ETH = {rate.toString()} AUX</p>
          <p><strong>Red:</strong> {network}</p>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">🧾 Historial de transacciones</h2>
          <div className="flex justify-between mb-2">
            <button onClick={() => {
              if (window.confirm("¿Estás seguro de que quieres borrar el historial?")) {
                localStorage.removeItem("aux_tx_history");
                setHistory([]);
                toast.success("Historial borrado ✅");
              }
            }} className="text-sm text-red-400 hover:underline">Limpiar</button>
            <button onClick={exportHistory} className="text-sm text-blue-400 hover:underline">Exportar</button>
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-gray-400">Aún no hay transacciones.</p>
          ) : (
            <ul className="space-y-1 text-sm text-gray-200">
              {history.map((item, idx) => (
                <li key={idx} className="border-b border-gray-700 pb-1">
                  <strong>{item.type}</strong> — {item.details} <span className="text-gray-400">({item.timestamp})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
