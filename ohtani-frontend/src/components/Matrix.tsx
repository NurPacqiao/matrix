import { useState, useEffect } from "react";
import api from "../api";

export default function Matrix() {
  const [gridData, setGridData] = useState<string[]>(Array(81).fill(""));

  useEffect(() => {
    const fetchMatrix = async () => {
      try {
        const response = await api.get("/matrix");
        if (response.data && response.data.matrixJson) {
          setGridData(JSON.parse(response.data.matrixJson));
        }
      } catch (error) {
        console.error("Failed to load matrix", error);
      }
    };

    fetchMatrix();
  }, []);

  const syncMatrixToDatabase = async () => {
    try {
      const payload = { matrixJson: JSON.stringify(gridData) };
      await api.post("/matrix", payload);
      alert("Matrix saved!");
    } catch (error) {
      console.error("Failed to sync matrix", error);
    }
  };

  const updateCell = (index: number, value: string) => {
    const newGrid = [...gridData];
    newGrid[index] = value;
    setGridData(newGrid);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      {/* Header code stays the same */}

      <div className="p-6 flex-grow flex flex-col items-center justify-center bg-slate-50/50">
        <div className="grid grid-cols-9 gap-[1px] bg-slate-300 p-[1px] border border-slate-300 rounded-sm shadow-inner">
          {gridData.map((cellText, index) => (
            <input
              key={index}
              value={cellText}
              onChange={(e) => updateCell(index, e.target.value)}
              className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white hover:bg-indigo-50 cursor-pointer transition-colors duration-150 flex items-center justify-center text-xs text-center text-slate-700 outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            />
          ))}
        </div>
      </div>

      <div className="p-6 border-t border-slate-100 bg-white">
        <button
          onClick={syncMatrixToDatabase}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Save Matrix Status
        </button>
      </div>
    </div>
  );
}
