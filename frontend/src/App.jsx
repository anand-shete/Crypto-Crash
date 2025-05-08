import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const socket = io("http://localhost:3000");

export default function App() {
  const [playerId, setPlayerId] = useState("");
  const [balance, setBalance] = useState({
    BTC: { crypto: 0, usd: 0 },
    ETH: { crypto: 0, usd: 0 },
  });
  const [cryptoCurrency, setCryptoCurrency] = useState("BTC");
  const [multiplier, setMultiplier] = useState(1);
  const [roundStatus, setRoundStatus] = useState("Waiting");
  const [currentRoundId, setCurrentRoundId] = useState(null);
  const [events, setEvents] = useState([]);
  const [countdown, setCountdown] = useState(0);
  const [startTime, setStartTime] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const secondsLeft = Math.max(0, Math.ceil((startTime - now) / 1000));
      setCountdown(secondsLeft);
      if (secondsLeft === 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  useEffect(() => {
    if (!playerId) return;
    const fetchBalance = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/balance/${playerId}`
        );
        setBalance(response.data);
      } catch (error) {
        console.error("Error fetching balance:", error);
        setEvents((prev) => [...prev, "Error: Could not fetch balance"]);
      }
    };
    fetchBalance();
  }, [playerId]);

  useEffect(() => {
    socket.on("welcome", (data) => {
      setStartTime(new Date(data.start_time).getTime());
    });

    socket.on("round_create", (data) => {
      setEvents((prev) => [
        ...prev,
        `Upcoming Round Hash seed: ${data.seed_hash}`,
      ]);
      setRoundStatus("Waiting");
      setCurrentRoundId(data.round_id);
      setStartTime(new Date(data.start_time).getTime());
    });

    socket.on("round_start", (data) => {
      setRoundStatus("Running");
    });

    socket.on("multiplier_update", (data) => {
      setMultiplier(data.multiplier);
    });

    socket.on("player_cashout", async (data) => {
      const response = await axios.get(
        `http://localhost:3000/balance/${data.player_id}`
      );
      setBalance(response.data);
      toast.success(`You cashed out $${data.usd_payout.toFixed(2)}`);
      setEvents((prev) => [
        ...prev,
        `Player ${data.player_id} cashed out: ${data.usd_payout} USD`,
      ]);
    });

    socket.on("round_crash", (data) => {
      setEvents((prev) => [
        ...prev,
        `Round Crashed at: ${data.crash_point.toFixed(2)}x
          Verify with Server seed: ${data.server_seed} `,
      ]);

      setRoundStatus("Crashed");
      setMultiplier(1);
      // setCurrentRoundId(null);
    });

    return () => {
      socket.off("round_create");
      socket.off("round_start");
      socket.off("multiplier_update");
      socket.off("player_cashout");
      socket.off("round_crash");
    };
  }, []);

  const createPlayer = async () => {
    try {
      const response = await axios.post("http://localhost:3000/create-player", {
        usd: 1000,
        btc_split: 0.5, // control the splitting
      });
      const newPlayerId = response.data.playerId;
      setPlayerId(newPlayerId);
    } catch (error) {
      console.error("Error creating player:", error);
      setEvents((prev) => [...prev, "Error: Could not initialize player"]);
    }
  };
  const addPlayer = async () => {
    const playerId = document.getElementById("playerIdInput").value;
    setPlayerId(playerId);
    try {
      const res = await axios.get(`http://localhost:3000/verify/${playerId}`);
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Player Doesn't Exists");
    }
  };

  const placeBet = async () => {
    const betAmount = document.getElementById("betAmount").value;
    if (!betAmount || betAmount <= 0) {
      toast.error("Invalid bet amount");
      return;
    }
    try {
      await axios.post("http://localhost:3000/bet", {
        player_id: playerId,
        usd_amount: parseFloat(betAmount),
        crypto_currency: cryptoCurrency,
        start_time: startTime,
      });
      toast.success(`Bet placed: ${betAmount} USD in ${cryptoCurrency}`);
      setEvents((prev) => [
        ...prev,
        `Bet placed: ${betAmount} USD in ${cryptoCurrency}`,
      ]);
      document.getElementById("placeBetBtn").disabled = true;
      document.getElementById("betAmount").value = "";

      const response = await axios.get(
        `http://localhost:3000/balance/${playerId}`
      );
      setBalance(response.data);
    } catch (error) {
      console.error("Error placing bet:", error);
      toast.error(error.response?.data?.error || "Could not place bet");
      setEvents((prev) => [
        ...prev,
        `Error: ${error.response?.data?.error || "Could not place bet"}`,
      ]);
    }
  };

  const cashOut = async () => {
    if (!currentRoundId) {
      toast.error("Wait for Next Round");
      return;
    }
    socket.emit("cashout", {
      player_id: playerId,
      round_id: currentRoundId,
    });
    document.getElementById("cashOutBtn").disabled = true;
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <h1 className="text-4xl font-bold mb-6">Crypto Crash Game</h1>

      <div className="bg-white shadow-2xl rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Player ID</h2>
        <Input id="playerIdInput" type={"text"} className={"max-w-xl"} />
        <Button className="mt-4" onClick={createPlayer}>
          Create
        </Button>
        <Button className="mt-4 ml-5" onClick={addPlayer}>
          Existing
        </Button>
      </div>

      {/* Wallet Balance */}
      <div className="bg-white shadow-2xl rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Wallet Balance</h2>
        <p>
          BTC: {balance.BTC.crypto.toFixed(8)}
          <span className="font-bold text-xl">
            {" "}
            (${balance.BTC.usd.toFixed(2)})
          </span>
        </p>
        <p>
          ETH: {balance.ETH.crypto.toFixed(8)}{" "}
          <span className="font-bold text-xl">
            (${balance.ETH.usd.toFixed(2)})
          </span>
        </p>
      </div>

      <div className="bg-white shadow-2xl rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Place Bet</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            type="number"
            id="betAmount"
            className="flex-1 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Bet amount in USD"
            min="0"
            disabled={roundStatus !== "Waiting"}
          />
          <select
            value={cryptoCurrency}
            onChange={(e) => setCryptoCurrency(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={roundStatus !== "Waiting"}
          >
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
          </select>
          <Button
            onClick={placeBet}
            id="placeBetBtn"
            className={`bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed ${
              roundStatus !== "Waiting"
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer"
            }`}
            disabled={currentRoundId === null || roundStatus !== "Waiting"}
          >
            Place Bet
          </Button>
        </div>
      </div>

      {/* Current Round */}
      <div className="bg-white shadow-2xl rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold  mb-4">Current Round</h2>
        <p>
          Status: <span className="font-bold">{roundStatus}</span>{" "}
          {roundStatus === "Waiting" && countdown + "s"}
        </p>
        <p>Multiplier: {multiplier?.toFixed(2)}x</p>
        <Button
          onClick={cashOut}
          id="cashOutBtn"
          className="mt-4 bg-green-600 text-white rounded-lg px-4 py-2 hover:bg-green-700 transition cursor-pointer"
          disabled={roundStatus !== "Running"}
        >
          Cash Out
        </Button>
      </div>

      {/* Event Log */}
      <div className="bg-white shadow-2xl rounded-lg p-6">
        <h2 className="text-xl font-semibold  mb-4">Event Log</h2>
        <ul className="list-disc pl-5 text-gray-700 max-h-64 overflow-y-auto">
          {events.slice(-20).map((event, index) => (
            <li key={index} className="py-1">
              {event}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
