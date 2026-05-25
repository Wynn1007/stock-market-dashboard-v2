import React, { useState, useEffect } from "react";
import { LedgerEntry } from "../types";
import { BookOpen, DollarSign, PlusCircle, Trash2, PieChart, TrendingDown, TrendingUp, Wallet, BellRing } from "lucide-react";

interface FinancialLedgerProps {
  lang: "zh" | "en";
  theme: "midnight" | "milk";
  token: string | null;
  onShowLoginToast: () => void;
}

export default function FinancialLedger({ lang, theme, token, onShowLoginToast }: FinancialLedgerProps) {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState<string>("Food");
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState<string>("");
  const [budget, setBudget] = useState<number>(50000); // Default monthly budget limit
  const [budgetInput, setBudgetInput] = useState<string>("50000");
  const [isSettingBudget, setIsSettingBudget] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Localization Dictionary
  const t = {
    zh: {
      budgetTitle: "本月支出預算設定",
      budgetLimit: "預算額度",
      setBudget: "設定預算",
      budgetSpent: "預算已消耗",
      budgetRemaining: "預算餘額",
      addRecord: "新增收支記帳",
      type: "收支類型",
      income: "收入 (Income)",
      expense: "支出 (Expense)",
      category: "記帳分類",
      amount: "金額",
      date: "紀事日期",
      description: "明細 / 備註內容",
      submit: "申報記入 Ledger",
      listTitle: "Wynn 2.0 綜合記帳流水帳",
      noRecords: "目前暫無收支記帳資料，請點擊申報新增第一筆！",
      deleteConfirm: "已成功刪除記帳項目",
      statsTitle: "記帳數據動態圖表與比率分析",
      totalIncome: "月度累計收入",
      totalExpense: "月度累計支出",
      balance: "月度淨餘裕額",
      salary: "薪資",
      invest: "投資",
      bonus: "獎金",
      others: "其他",
      food: "飲食",
      rent: "租金",
      entertainment: "娛樂",
      traffic: "交通",
      shopping: "購物",
      unauthorized: "⚠️ 請先在設定中登入，以將記帳紀錄備份至 SQLite 資料庫中。",
      alertOverBudget: "🚨 警報！本月支出已超出設定預算！請縮減開支。"
    },
    en: {
      budgetTitle: "Monthly Spent Budget Limit",
      budgetLimit: "Budget Cap",
      setBudget: "Set Budget",
      budgetSpent: "Budget Dispatched",
      budgetRemaining: "Budget Remaining",
      addRecord: "New Ledger Declaration",
      type: "Declaration Type",
      income: "Income",
      expense: "Expense",
      category: "Category",
      amount: "Amount Value",
      date: "Date",
      description: "Notes / Descriptions",
      submit: "Declare and Record Ledger",
      listTitle: "Wynn 2.0 Active Ledger Feed",
      noRecords: "No recorded statements. Click declare to insert your first ledger!",
      deleteConfirm: "Ledger entry successfully deleted",
      statsTitle: "Dynamic Chart & Ratio Breakdown",
      totalIncome: "Cumulative Income",
      totalExpense: "Cumulative Expense",
      balance: "Net Disposable Margin",
      salary: "Salary",
      invest: "Investment",
      bonus: "Bonus",
      others: "Others",
      food: "Food",
      rent: "Rent",
      entertainment: "Entertainment",
      traffic: "Traffic",
      shopping: "Shopping",
      unauthorized: "⚠️ Please sign-in inside account settings to persist your bookkeeping records.",
      alertOverBudget: "🚨 Budget Alert! Monthly expenses have exceeded the designated budget cap!"
    }
  }[lang];

  // Map category translators
  const categoryLabel = (cat: string) => {
    const dict: Record<string, string> = {
      Salary: lang === "zh" ? "薪資" : "Salary",
      Invest: lang === "zh" ? "投資" : "Invest",
      Bonus: lang === "zh" ? "獎金" : "Bonus",
      Food: lang === "zh" ? "飲食" : "Food",
      Rent: lang === "zh" ? "租金" : "Rent",
      Entertainment: lang === "zh" ? "娛樂" : "Entertainment",
      Traffic: lang === "zh" ? "交通" : "Traffic",
      Shopping: lang === "zh" ? "購物" : "Shopping",
      Others: lang === "zh" ? "其他" : "Others"
    };
    return dict[cat] || cat;
  };

  // Safe category triggers
  useEffect(() => {
    if (type === "income") {
      setCategory("Salary");
    } else {
      setCategory("Food");
    }
  }, [type]);

  const fetchLedger = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch("/api/ledger", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setLedger(data.ledger);
      }
    } catch (err) {
      console.error("Failed to load ledger flow:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      onShowLoginToast();
      return;
    }

    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      setErrorMsg(lang === "zh" ? "請輸入有效的交易金額！" : "Please input a valid positive amount.");
      return;
    }

    try {
      setErrorMsg(null);
      const res = await fetch("/api/ledger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          type,
          category,
          amount: value,
          date,
          description: description.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        setAmount("");
        setDescription("");
        fetchLedger();
      } else {
        setErrorMsg(data.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sync transaction reporting.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/ledger/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        fetchLedger();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // Budget calculations
  const totalIncome = ledger
    .filter((x) => x.type === "income")
    .reduce((sum, x) => sum + x.amount, 0);

  const totalExpense = ledger
    .filter((x) => x.type === "expense")
    .reduce((sum, x) => sum + x.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Calculate percentage of budget used
  const budgetPercentage = Math.min(100, Math.round((totalExpense / budget) * 100)) || 0;
  const isOverBudget = totalExpense > budget;

  // Compile categorization chart ratios
  const expenseCategories = ["Food", "Rent", "Entertainment", "Traffic", "Shopping", "Others"];
  const categorySums = expenseCategories.map((cat) => {
    const total = ledger
      .filter((x) => x.type === "expense" && x.category === cat)
      .reduce((sum, x) => sum + x.amount, 0);
    return { name: cat, value: total };
  });

  const maxExpenseCategoryVal = Math.max(...categorySums.map((x) => x.value)) || 1;

  // Apply visual settings bases
  const isMidnight = theme === "midnight";
  const bgCardClass = isMidnight ? "bg-[#1e293b] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-800";
  const bgInputClass = isMidnight ? "bg-slate-950 border-slate-800 text-slate-200 focus:border-cyan-500" : "bg-white border-slate-200 text-slate-800 focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500";
  const labelClass = isMidnight ? "text-slate-400" : "text-slate-500";
  const btnSubmitClass = isMidnight ? "bg-cyan-500 hover:bg-cyan-600 text-slate-950" : "bg-blue-600 hover:bg-blue-700 text-white";

  return (
    <div className="space-y-6 flex flex-col w-full" id="financial-ledger-container">
      {/* ⚠️ Warning If Unauthorized */}
      {!token && (
        <div className="p-4 bg-orange-100/80 border border-orange-200 rounded-lg text-xs font-semibold text-orange-950 flex items-center gap-2" id="unauth-ledger-notifier">
          <Wallet className="w-4 h-4 animate-bounce text-orange-600 shrink-0" />
          <span>{t.unauthorized}</span>
        </div>
      )}

      {/* Budget Indicator Bar panel */}
      {token && (
        <div className={`p-5 rounded-2xl border ${bgCardClass} shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6`} id="ledger-budget-dashboard">
          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <BookOpen className={`w-4 h-4 ${isMidnight ? "text-cyan-400 animate-pulse" : "text-blue-500 animate-pulse"}`} />
                <h3 className="font-bold text-xs uppercase tracking-widest">{t.budgetTitle}</h3>
              </div>
              <div className="flex items-center gap-2">
                {isSettingBudget ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={budgetInput}
                      onChange={(e) => setBudgetInput(e.target.value)}
                      className={`w-24 text-xs px-2 py-1 rounded border ${bgInputClass} font-mono`}
                    />
                    <button
                      onClick={() => {
                        const val = parseInt(budgetInput);
                        if (!isNaN(val) && val > 0) {
                          setBudget(val);
                          setIsSettingBudget(false);
                        }
                      }}
                      className={`px-2 py-1 rounded text-[10px] font-bold ${btnSubmitClass}`}
                    >
                      OK
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsSettingBudget(true)}
                    className="text-[10px] text-blue-600 dark:text-cyan-400 hover:underline cursor-pointer"
                  >
                    ⚙️ {lang === "zh" ? "設定額度" : "Adjust cap"}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-baseline justify-between text-xs py-1">
              <span>{t.budgetLimit}: <strong className="font-mono">${budget.toLocaleString()}</strong></span>
              <span>{t.budgetSpent}: <strong className="font-mono text-rose-500">${totalExpense.toLocaleString()} ({budgetPercentage}%)</strong></span>
            </div>

            {/* Simulated progress bar */}
            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${isOverBudget ? "bg-rose-500 animate-pulse" : isMidnight ? "bg-cyan-400" : "bg-blue-600"}`}
                style={{ width: `${budgetPercentage}%` }}
              />
            </div>

            {isOverBudget && (
              <p className="text-[10px] font-bold text-rose-500 animate-pulse flex items-center gap-1">
                <BellRing className="w-3 h-3 text-rose-500" />
                {t.alertOverBudget}
              </p>
            )}
          </div>

          {/* Quick numbers totals */}
          <div className="grid grid-cols-3 gap-6 text-center border-l-0 md:border-l border-slate-200 dark:border-slate-800 pl-0 md:pl-6 shrink-0 w-full md:w-auto">
            <div>
              <span className={`text-[10px] font-semibold uppercase ${labelClass}`}>{t.totalIncome}</span>
              <p className="font-mono font-bold text-emerald-500 text-sm mt-0.5">${totalIncome.toLocaleString()}</p>
            </div>
            <div>
              <span className={`text-[10px] font-semibold uppercase ${labelClass}`}>{t.totalExpense}</span>
              <p className="font-mono font-bold text-rose-500 text-sm mt-0.5">${totalExpense.toLocaleString()}</p>
            </div>
            <div>
              <span className={`text-[10px] font-semibold uppercase ${labelClass}`}>{t.balance}</span>
              <p className={`font-mono font-bold text-sm mt-0.5 ${netBalance >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                ${netBalance.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grid: 1. Input Ledger Form. 2. Charts Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full" id="ledger-operations-deck">
        
        {/* Declare ledger entries */}
        <div className={`col-span-1 lg:col-span-5 p-5 border rounded-2xl ${bgCardClass} shadow-xs flex flex-col space-y-4`}>
          <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <PlusCircle className={`w-4 h-4 ${isMidnight ? "text-cyan-400" : "text-blue-500"}`} />
            {t.addRecord}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Income vs Expenses Selector */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setType("expense")}
                className={`py-1.5 text-xs font-bold rounded-md cursor-pointer transition ${
                  type === "expense"
                    ? "bg-rose-500 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {lang === "zh" ? "📉 支出" : "Expense"}
              </button>
              <button
                type="button"
                onClick={() => setType("income")}
                className={`py-1.5 text-xs font-bold rounded-md cursor-pointer transition ${
                  type === "income"
                    ? "bg-emerald-500 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {lang === "zh" ? "📈 收入" : "Income"}
              </button>
            </div>

            {/* Category selection */}
            <div className="space-y-1">
              <label className={`text-[10px] font-semibold uppercase ${labelClass}`}>{t.category}</label>
              <select
                id="ledger-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full text-xs px-3 py-2 rounded-lg border outline-none font-sans font-medium cursor-pointer ${bgInputClass}`}
              >
                {type === "income" ? (
                  <>
                    <option value="Salary">{lang === "zh" ? "薪資 (Salary)" : "Salary"}</option>
                    <option value="Invest">{lang === "zh" ? "投資 (Investment)" : "Investment"}</option>
                    <option value="Bonus">{lang === "zh" ? "獎金 (Bonus)" : "Bonus"}</option>
                    <option value="Others">{lang === "zh" ? "其他支吾 (Others)" : "Others"}</option>
                  </>
                ) : (
                  <>
                    <option value="Food">{lang === "zh" ? "飲食 (Food)" : "Food"}</option>
                    <option value="Rent">{lang === "zh" ? "租金 (Rent)" : "Rent"}</option>
                    <option value="Entertainment">{lang === "zh" ? "娛樂 (Entertainment)" : "Entertainment"}</option>
                    <option value="Traffic">{lang === "zh" ? "交通 (Traffic)" : "Traffic"}</option>
                    <option value="Shopping">{lang === "zh" ? "購物 (Shopping)" : "Shopping"}</option>
                    <option value="Others">{lang === "zh" ? "其他 (Others)" : "Others"}</option>
                  </>
                )}
              </select>
            </div>

            {/* Amount & Date inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={`text-[10px] font-semibold uppercase ${labelClass}`}>{t.amount}</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-[10px] font-mono text-slate-400 font-bold">$</span>
                  <input
                    id="ledger-amount-input"
                    type="number"
                    min="0"
                    step="any"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`w-full text-xs pl-6 pr-3 py-2 border rounded-lg outline-none font-mono ${bgInputClass}`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={`text-[10px] font-semibold uppercase ${labelClass}`}>{t.date}</label>
                <input
                  id="ledger-date-input"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-lg outline-none font-mono ${bgInputClass}`}
                />
              </div>
            </div>

            {/* Description note */}
            <div className="space-y-1">
              <label className={`text-[10px] font-semibold uppercase ${labelClass}`}>{t.description}</label>
              <input
                id="ledger-description-input"
                type="text"
                placeholder={lang === "zh" ? "項目描述..." : "Memo context..."}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full text-xs px-3 py-2 border rounded-lg outline-none ${bgInputClass}`}
              />
            </div>

            {/* Error notifications */}
            {errorMsg && (
              <p className="text-[10px] font-bold text-rose-500 animate-pulse">{errorMsg}</p>
            )}

            {/* Submit Declarations */}
            <button
              id="ledger-submit-btn"
              type="submit"
              disabled={!token}
              className={`w-full py-2.5 rounded-lg text-xs font-bold cursor-pointer transition focus:ring-2 focus:ring-offset-2 ${btnSubmitClass} disabled:bg-slate-300 disabled:cursor-not-allowed`}
            >
              {t.submit}
            </button>
          </form>
        </div>

        {/* Dynamic ratio statistics breakdown visualizer */}
        <div className={`col-span-1 lg:col-span-7 p-5 border rounded-2xl ${bgCardClass} shadow-xs flex flex-col space-y-4`}>
          <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <PieChart className={`w-4 h-4 ${isMidnight ? "text-cyan-400" : "text-blue-500"}`} />
            {t.statsTitle}
          </h3>

          {ledger.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs">
              <span>{t.noRecords}</span>
            </div>
          ) : (
            <div className="flex-1 flex flex-col space-y-6">
              {/* Custom SVG/Bar chart displaying Expense ratios by Category */}
              <div className="space-y-3.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider font-sans ${labelClass}`}>
                  {lang === "zh" ? "📊 本月開銷項目權重佔比" : "📊 Budget Categories Ratio Weight"}
                </span>

                <div className="space-y-2.5">
                  {categorySums.map((catSum) => {
                    const ratio = totalExpense > 0 ? (catSum.value / totalExpense) * 100 : 0;
                    const normalizedWidth = (catSum.value / maxExpenseCategoryVal) * 100 || 0;
                    return (
                      <div key={catSum.name} className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              catSum.name === "Food" ? "bg-amber-500" :
                              catSum.name === "Rent" ? "bg-purple-500" :
                              catSum.name === "Entertainment" ? "bg-rose-500" :
                              catSum.name === "Traffic" ? "bg-blue-500" :
                              catSum.name === "Shopping" ? "bg-teal-500" : "bg-slate-400"
                            }`} />
                            {categoryLabel(catSum.name)}
                          </span>
                          <span className="font-mono text-slate-500 dark:text-slate-400">
                            ${catSum.value.toLocaleString()} ({ratio.toFixed(1)}%)
                          </span>
                        </div>
                        {/* Horizontal Bar diagram */}
                        <div className="h-2 w-full bg-slate-50 dark:bg-slate-950 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              catSum.name === "Food" ? "bg-amber-500" :
                              catSum.name === "Rent" ? "bg-purple-500" :
                              catSum.name === "Entertainment" ? "bg-rose-500" :
                              catSum.name === "Traffic" ? "bg-blue-500" :
                              catSum.name === "Shopping" ? "bg-teal-500" : "bg-slate-400"
                            }`}
                            style={{ width: `${normalizedWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic ratios */}
              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs font-medium">
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className={labelClass}>{lang === "zh" ? "實得儲蓄率" : "Net Saving Rate"}</span>
                  <p className="text-sm font-black font-mono mt-1 text-emerald-500">
                    {totalIncome > 0 ? `${Math.max(0, Math.round((netBalance / totalIncome) * 100))}%` : "0%"}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className={labelClass}>{lang === "zh" ? "非必要娛樂支出佔比" : "Discretionary Ratio"}</span>
                  <p className="text-sm font-black font-mono mt-1 text-rose-500">
                    {totalExpense > 0 
                      ? `${Math.round(((ledger.filter(x => x.category === "Entertainment").reduce((sum, x) => sum + x.amount, 0)) / totalExpense) * 100)}%`
                      : "0%"}
                  </p>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Ledger Feed table listings */}
      <div className={`p-5 border rounded-2xl ${bgCardClass} shadow-xs`} id="ledger-history-table">
        <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
          <BookOpen className={`w-4 h-4 ${isMidnight ? "text-cyan-400" : "text-blue-500"}`} />
          {t.listTitle}
        </h3>

        <div className="overflow-x-auto" id="ledger-timeline-records">
          {loading ? (
            <div className="py-12 flex justify-center text-slate-400 text-xs">
              <span>{lang === "zh" ? "讀取帳簿中..." : "Accessing Ledger..."}</span>
            </div>
          ) : ledger.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <span>{t.noRecords}</span>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 uppercase font-black tracking-wider">
                  <th className="py-3 px-2">{lang === "zh" ? "紀事日期" : "Date"}</th>
                  <th className="py-3 px-2">{lang === "zh" ? "科目分類" : "Category"}</th>
                  <th className="py-3 px-2">{lang === "zh" ? "流水項目" : "Description"}</th>
                  <th className="py-3 px-2 text-right">{lang === "zh" ? "實借申報額" : "Amount"}</th>
                  <th className="py-3 px-2 text-right">{lang === "zh" ? "廢除" : "Action"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {ledger.map((entry) => {
                  const isExpense = entry.type === "expense";
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/30 transition">
                      <td className="py-2.5 px-2 font-mono whitespace-nowrap">{entry.date}</td>
                      <td className="py-2.5 px-2">
                        <span className={`px-2 py-0.5 rounded-sm font-semibold text-[9px] uppercase tracking-wider ${
                          isExpense ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                        }`}>
                          {categoryLabel(entry.category)}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-slate-500 dark:text-slate-400 font-medium truncate max-w-[200px]" title={entry.description}>
                        {entry.description || "-"}
                      </td>
                      <td className={`py-2.5 px-2 text-right font-mono font-bold ${isExpense ? "text-rose-500" : "text-emerald-500"}`}>
                        {isExpense ? "-" : "+"}${entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <button
                          id={`delete-ledger-btn-${entry.id}`}
                          onClick={() => handleDelete(entry.id)}
                          className="p-1 px-1.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-700 transition cursor-pointer"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
