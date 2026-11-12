"use client";

import { useEffect, useRef, useState } from "react";
import { QozmoMark } from "./brand";
import {
  ArrowDownLeft,
  ArrowRight,
  Check,
  CircleHelp,
  Clapperboard,
  Command,
  CreditCard,
  Dribbble,
  Eye,
  EyeOff,
  LayoutDashboard,
  ListFilter,
  Spotify,
  Linear,
  PiggyBank,
  Search,
  Sparkles,
  Wifi,
  X,
} from "./icons";
import "../app/demo.css";

type DemoTab = "overview" | "cards" | "activity";
type Period = "daily" | "weekly" | "monthly";

type WalletDemoProps = {
  onClose: () => void;
  initialTab?: DemoTab;
};

const transactions = [
  { id: "spotify", merchant: "Spotify Premium", category: "Entertainment", date: "Today, 9:42 AM", amount: -12.99, icon: Spotify, tone: "green" },
  { id: "linear", merchant: "Linear", category: "Software", date: "Yesterday, 4:20 PM", amount: -10, icon: Linear, tone: "ink" },
  { id: "dribbble", merchant: "Dribbble Pro", category: "Design tools", date: "Yesterday, 10:04 AM", amount: -15, icon: Dribbble, tone: "rose" },
  { id: "netflix", merchant: "Netflix", category: "Entertainment", date: "Nov 06, 8:12 PM", amount: -15.49, icon: Clapperboard, tone: "red" },
  { id: "alex", merchant: "Alex Morgan", category: "Transfer received", date: "Nov 05, 2:26 PM", amount: 480, icon: ArrowDownLeft, tone: "lavender" },
  { id: "savings", merchant: "Savings pocket", category: "Transfer", date: "Nov 04, 8:30 AM", amount: -250, icon: PiggyBank, tone: "blue" },
];

const spending: Record<Period, { label: string; title: string; labels: string[]; values: number[] }> = {
  daily: {
    label: "Daily",
    title: "Spending today",
    labels: ["6 am", "9 am", "12 pm", "3 pm", "6 pm", "9 pm", "12 am"],
    values: [0, 12.99, 0, 15, 10, 15.49, 0],
  },
  weekly: {
    label: "Weekly",
    title: "Spending this week",
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    values: [25.4, 48.98, 36.85, 53.48, 42.35, 31.24, 42.05],
  },
  monthly: {
    label: "Monthly",
    title: "Spending this month",
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    values: [285.8, 324.35, 280.35, 350.3],
  },
};

const cards = [
  { name: "Everyday", ending: "8394", tone: "pink", description: "For all the little things." },
  { name: "Travel", ending: "4821", tone: "lavender", description: "A little room to explore." },
  { name: "Online", ending: "7210", tone: "dark", description: "Your digital daily essentials." },
];

const navigation = [
  { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
  { id: "cards" as const, label: "Cards", icon: CreditCard },
  { id: "activity" as const, label: "Activity", icon: ListFilter },
];

const usd = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

function TransactionList({ items }: { items: typeof transactions }) {
  return (
    <ul className="wd-transactions">
      {items.map((transaction) => {
        const Icon = transaction.icon;
        return (
          <li key={transaction.id} className="wd-transaction">
            <span className={`wd-merchant-icon wd-tone-${transaction.tone}`} aria-hidden="true">
              <Icon size={19} strokeWidth={1.8} />
            </span>
            <div className="wd-transaction-detail">
              <span className="wd-merchant">{transaction.merchant}</span>
              <span className="wd-transaction-meta">{transaction.date}</span>
            </div>
            <span className={`wd-transaction-amount${transaction.amount > 0 ? " wd-incoming" : ""}`}>
              {transaction.amount > 0 ? "+" : "−"}{usd(Math.abs(transaction.amount))}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function WalletDemo({ onClose, initialTab = "overview" }: WalletDemoProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const backdropPointerRef = useRef(false);
  const [tab, setTab] = useState<DemoTab>(initialTab);
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [period, setPeriod] = useState<Period>("weekly");
  const [activeCard, setActiveCard] = useState(0);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      const currentPadding = Number.parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
      document.body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
    }
    if (dialog && !dialog.open) dialog.showModal();

    return () => {
      if (dialog?.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  const chart = spending[period];
  const spendingTotal = Math.round(chart.values.reduce((total, value) => total + value, 0) * 100) / 100;
  const chartMax = Math.max(...chart.values);
  const selectedCard = cards[activeCard];
  const normalizedQuery = query.trim().toLowerCase();
  const filteredTransactions = transactions.filter((transaction) =>
    `${transaction.merchant} ${transaction.category}`.toLowerCase().includes(normalizedQuery),
  );
  const titles: Record<DemoTab, string> = {
    overview: "A little more clarity.",
    cards: "A card for your kind of day.",
    activity: "The little things, all here.",
  };

  return (
    <dialog
      ref={dialogRef}
      className="wd-dialog"
      aria-labelledby="wd-dialog-title"
      aria-describedby="wd-demo-disclaimer"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onPointerDown={(event) => {
        backdropPointerRef.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && backdropPointerRef.current) onClose();
        backdropPointerRef.current = false;
      }}
    >
      <div className="wd-shell">
        <aside className="wd-sidebar">
          <div className="wd-brand" aria-label="Qozmo Wallet">
            <QozmoMark className="wd-brand-mark" />
            <span>qozmo<span className="wd-brand-period">.</span></span>
          </div>
          <div className="wd-sidebar-label">YOUR WALLET</div>
          <nav className="wd-nav" aria-label="Wallet demo sections">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`wd-nav-item${tab === item.id ? " wd-nav-active" : ""}`}
                  aria-pressed={tab === item.id}
                  onClick={() => setTab(item.id)}
                >
                  <Icon size={18} strokeWidth={1.65} aria-hidden="true" />
                  <span>{item.label}</span>
                  {tab === item.id && <span className="wd-nav-dot" aria-hidden="true" />}
                </button>
              );
            })}
          </nav>
          <div className="wd-sidebar-bottom">
            <Sparkles size={23} strokeWidth={1.25} aria-hidden="true" />
            <p>Your money.<br />A little more you.</p>
            <span className="wd-preview-tag">PREVIEW MODE</span>
          </div>
        </aside>

        <div className="wd-main">
          <header className="wd-header">
            <div>
              <span className="wd-eyebrow"><span className="wd-status-dot" />Interactive demo</span>
              <h2 id="wd-dialog-title">{titles[tab]}</h2>
            </div>
            <button className="wd-close" type="button" onClick={onClose} aria-label="Close wallet demo" autoFocus>
              <X size={21} strokeWidth={1.6} aria-hidden="true" />
            </button>
          </header>

          {tab === "overview" && (
            <div className="wd-view wd-overview">
              <div className="wd-overview-top">
                <div className="wd-balance-block">
                  <div className="wd-balance-label">
                    <span>Total balance</span>
                    <button
                      className="wd-eye"
                      type="button"
                      onClick={() => setBalanceHidden((hidden) => !hidden)}
                      aria-label={balanceHidden ? "Show balance" : "Hide balance"}
                      aria-pressed={balanceHidden}
                    >
                      {balanceHidden ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                    </button>
                  </div>
                  <div className={`wd-balance${balanceHidden ? " wd-balance-hidden" : ""}`} aria-live="polite">
                    {balanceHidden ? <span aria-label="Balance hidden">••••••</span> : <>$23,350<span>.35</span></>}
                  </div>
                  <span className="wd-currency"><span aria-hidden="true">$</span> US Dollar</span>
                </div>
                <button
                  className={`wd-peek-card wd-palette-${selectedCard.tone}`}
                  type="button"
                  onClick={() => setTab("cards")}
                  aria-label={`View ${selectedCard.name.toLowerCase()} sample card ending in ${selectedCard.ending}`}
                >
                  <span className="wd-peek-card-top"><span>qozmo.</span><Wifi size={17} aria-hidden="true" /></span>
                  <span className="wd-peek-card-number">•••• {selectedCard.ending}</span>
                  <span className="wd-peek-card-bottom">{selectedCard.name} <ArrowRight size={14} aria-hidden="true" /></span>
                </button>
              </div>

              <section className="wd-spending" aria-labelledby="wd-spending-title">
                <div className="wd-spending-header">
                  <div className="wd-spending-total">
                    <h3 id="wd-spending-title">{chart.title}</h3>
                    <span aria-live="polite">{usd(spendingTotal)}</span>
                  </div>
                  <div className="wd-periods" role="group" aria-label="Spending time period">
                    {(Object.keys(spending) as Period[]).map((key) => (
                      <button
                        key={key}
                        className={period === key ? "wd-period-active" : ""}
                        type="button"
                        aria-pressed={period === key}
                        onClick={() => setPeriod(key)}
                      >
                        {spending[key].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div
                  className="wd-chart"
                  role="img"
                  aria-label={`Sample ${chart.title.toLowerCase()}: ${chart.labels.map((label, index) => `${label} ${usd(chart.values[index])}`).join(", ")}. Total ${usd(spendingTotal)}.`}
                >
                  <div className="wd-chart-grid" aria-hidden="true"><span /><span /><span /></div>
                  <div className="wd-chart-bars" aria-hidden="true">
                    {chart.values.map((value, index) => (
                      <div className="wd-bar-column" key={`${period}-${index}`}>
                        <div className="wd-bar-space">
                          <span
                            className={`wd-bar${index === chart.values.indexOf(chartMax) ? " wd-bar-highlight" : ""}`}
                            style={{ height: `${Math.max((value / chartMax) * 100, 2)}%` }}
                            title={`${chart.labels[index]}: ${usd(value)}`}
                          ><span className="wd-bar-tooltip">{usd(value)}</span></span>
                        </div>
                        <span className="wd-bar-label">{chart.labels[index]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="wd-recent" aria-labelledby="wd-recent-title">
                <div className="wd-section-heading">
                  <h3 id="wd-recent-title">Recent activity</h3>
                  <button type="button" className="wd-text-button" onClick={() => setTab("activity")}>View all <ArrowRight size={13} aria-hidden="true" /></button>
                </div>
                <TransactionList items={transactions.slice(0, 3)} />
              </section>
            </div>
          )}

          {tab === "cards" && (
            <div className="wd-view wd-cards">
              <p className="wd-view-intro">Different plans. A little space for each.</p>
              <div className="wd-card-stage">
                <div className="wd-card-stage-orbit" aria-hidden="true" />
                <div className={`wd-full-card wd-palette-${selectedCard.tone}`}>
                  <div className="wd-full-card-top"><span className="wd-card-wordmark">qozmo.</span><span className="wd-card-sample">SAMPLE CARD</span></div>
                  <div className="wd-card-chip-row"><span className="wd-card-chip" aria-hidden="true"><span /><span /><span /></span><Wifi size={23} strokeWidth={1.6} aria-hidden="true" /></div>
                  <div className="wd-card-number">•••• &nbsp;•••• &nbsp;•••• &nbsp;{selectedCard.ending}</div>
                  <div className="wd-card-bottom"><span>QOZMO MEMBER</span><span>12/29</span></div>
                </div>
              </div>
              <div className="wd-active-card-info" aria-live="polite">
                <h3>{selectedCard.name} card</h3>
                <p>{selectedCard.description}</p>
              </div>
              <div className="wd-card-choice-heading">CHOOSE YOUR CARD</div>
              <div className="wd-card-choices" role="group" aria-label="Choose a sample card">
                {cards.map((card, index) => (
                  <button
                    type="button"
                    className={`wd-card-choice${activeCard === index ? " wd-card-selected" : ""}`}
                    key={card.ending}
                    onClick={() => setActiveCard(index)}
                    aria-pressed={activeCard === index}
                    aria-label={`${card.name} sample card ending in ${card.ending}`}
                  >
                    <span className={`wd-card-swatch wd-palette-${card.tone}`} aria-hidden="true"><span /></span>
                    <span className="wd-card-choice-copy"><strong>{card.name}</strong><span>•••• {card.ending}</span></span>
                    <span className={`wd-card-selection-mark${activeCard === index ? " wd-card-is-selected" : ""}`} aria-hidden="true">{activeCard === index && <Check size={11} strokeWidth={2.5} />}</span>
                  </button>
                ))}
              </div>
              <p className="wd-card-hint">Choose a card to see it in your wallet overview.</p>
            </div>
          )}

          {tab === "activity" && (
            <div className="wd-view wd-activity">
              <p className="wd-view-intro">A clear view of what comes in and goes out.</p>
              <div className="wd-search">
                <Search size={18} strokeWidth={1.7} aria-hidden="true" />
                <input
                  type="search"
                  aria-label="Search sample transactions"
                  placeholder="Search transactions"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
                {query && <button type="button" className="wd-search-clear" aria-label="Clear transaction search" onClick={() => setQuery("")}><X size={15} aria-hidden="true" /></button>}
              </div>
              <div className="wd-activity-label">
                <span>{normalizedQuery ? "SEARCH RESULTS" : "ALL TRANSACTIONS"}</span>
                <span aria-live="polite">{filteredTransactions.length} {filteredTransactions.length === 1 ? "transaction" : "transactions"}</span>
              </div>
              {filteredTransactions.length ? <TransactionList items={filteredTransactions} /> : (
                <div className="wd-empty">
                  <span className="wd-empty-icon"><Search size={23} strokeWidth={1.4} aria-hidden="true" /></span>
                  <h3>No transactions found</h3>
                  <p>Try a merchant like Spotify, or a category like entertainment.</p>
                  <button type="button" className="wd-empty-reset" onClick={() => setQuery("")}>Clear search <ArrowRight size={14} aria-hidden="true" /></button>
                </div>
              )}
            </div>
          )}

          <footer className="wd-demo-note" id="wd-demo-disclaimer"><CircleHelp size={13} strokeWidth={1.7} aria-hidden="true" /><span>Sample data · no real transactions</span></footer>
        </div>
      </div>
    </dialog>
  );
}
