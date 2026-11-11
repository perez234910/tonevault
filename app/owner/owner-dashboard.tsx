
"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/src/lib/supabase";

type OwnerOrder = {
  id: string;
  created_at: string;
  quantity: number;
  total_amount: number;
  escrow_status: string;
  product: {
    id: string;
    brand: string;
    model: string;
  } | null;
  buyer: {
    id: string;
    full_name: string;
  } | null;
};

type OwnerMetrics = {
  totalOrders: number;
  totalOrderValue: number;
  averageOrderValue: number;
  platformRevenue: number | null;
  revenueStatus: string;
  topSellingItems: {
    productId: string;
    name: string;
    quantitySold: number;
  }[];
  lowStockThreshold: number;
  lowStockItems: {
    id: string;
    name: string;
    stock: number;
  }[];
};

type OrdersResponse = {
  ok: boolean;
  error?: string;
  orders?: OwnerOrder[];
};

type MetricsResponse = {
  ok: boolean;
  error?: string;
  metrics?: OwnerMetrics;
};

function formatPeso(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) {
    return "Pending";
  }

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(value);
}

export function OwnerDashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [orders, setOrders] = useState<OwnerOrder[]>([]);
  const [metrics, setMetrics] = useState<OwnerMetrics | null>(null);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (token: string) => {
    setLoading(true);
    setError("");

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [ordersResponse, metricsResponse] = await Promise.all([
        fetch("/api/orders", {
          headers,
          cache: "no-store",
        }),
        fetch("/api/metrics", {
          headers,
          cache: "no-store",
        }),
      ]);

      const [ordersData, metricsData] = await Promise.all([
        ordersResponse.json() as Promise<OrdersResponse>,
        metricsResponse.json() as Promise<MetricsResponse>,
      ]);

      if (!ordersResponse.ok || !ordersData.ok) {
        throw new Error(
          ordersData.error ?? "Unable to retrieve orders.",
        );
      }

      if (!metricsResponse.ok || !metricsData.ok) {
        throw new Error(
          metricsData.error ?? "Unable to retrieve metrics.",
        );
      }

      setOrders(ordersData.orders ?? []);
      setMetrics(metricsData.metrics ?? null);
    } catch (err) {
      setOrders([]);
      setMetrics(null);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the Owner Dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;

      setSession(nextSession);

      if (
        nextSession &&
        (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")
      ) {
        void loadDashboard(nextSession.access_token);
      }

      if (event === "SIGNED_OUT") {
        setOrders([]);
        setMetrics(null);
        setError("");
      }
    });

    async function initializeSession() {
      const { data, error: sessionError } =
        await supabase.auth.getSession();

      if (!active) return;

      if (sessionError) {
        setError(sessionError.message);
      }

      if (data.session) {
        setSession(data.session);
        void loadDashboard(data.session.access_token);
      }

      setInitializing(false);
    }

    void initializeSession();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadDashboard]);

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setSigningIn(true);
    setError("");

    try {
      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (loginError) {
        throw loginError;
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in.",
      );
    } finally {
      setSigningIn(false);
    }
  }

  async function handleLogout() {
    const { error: logoutError } = await supabase.auth.signOut();

    if (logoutError) {
      setError(logoutError.message);
    }
  }

  if (initializing) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <p className="text-sm text-muted">
          Checking administrator session...
        </p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-20">
        <div className="rounded-2xl border border-line bg-panel p-7">
          <p className="text-xs uppercase tracking-[0.22em] text-gold">
            ToneVault Administration
          </p>

          <h1 className="mt-3 font-serif text-4xl">
            Owner Login
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted">
            Sign in using your Supabase administrator account
            to access marketplace analytics.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="owner-email"
                className="mb-2 block text-sm text-muted"
              >
                Email address
              </label>

              <input
                id="owner-email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-line bg-background px-4 py-3 text-foreground outline-none focus:border-gold"
              />
            </div>

            <div>
              <label
                htmlFor="owner-password"
                className="mb-2 block text-sm text-muted"
              >
                Password
              </label>

              <input
                id="owner-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-line bg-background px-4 py-3 text-foreground outline-none focus:border-gold"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-900 bg-red-950/30 p-3 text-sm text-red-300"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={signingIn}
              className="w-full rounded-full bg-gold px-5 py-3 text-sm font-semibold text-background hover:bg-gold-soft disabled:opacity-50"
            >
              {signingIn ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  const topSellingItems = metrics?.topSellingItems ?? [];

  const cards = [
    {
      label: "Total Orders",
      value: String(metrics?.totalOrders ?? "—"),
      description: "Saved marketplace transactions",
    },
    {
      label: "Total Order Value",
      value: metrics
        ? formatPeso(metrics.totalOrderValue)
        : "—",
      description: "Gross value of saved buyer orders",
    },
    {
      label: "Platform Revenue",
      value: formatPeso(metrics?.platformRevenue),
      description: "Commission and verification revenue",
    },
    {
      label: "Average Order Value",
      value: metrics
        ? formatPeso(metrics.averageOrderValue)
        : "—",
      description: "Average saved buyer order total",
    },
    {
      label: "Top-Selling Guitars",
      value: topSellingItems.length
        ? topSellingItems.map((item) => item.name).join(", ")
        : "No sales yet",
      description: topSellingItems.length
        ? `${topSellingItems[0].quantitySold} units sold each`
        : "Sales quantities",
    },
    {
      label: "Low-Stock Listings",
      value: String(metrics?.lowStockItems.length ?? "—"),
      description: `Stock threshold: ${metrics?.lowStockThreshold ?? "—"}`,
    },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            Marketplace Administration
          </p>

          <h1 className="mt-2 font-serif text-4xl sm:text-5xl">
            Owner Dashboard
          </h1>

          <p className="mt-3 text-sm text-muted">
            Monitor orders, revenue and guitar inventory.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void loadDashboard(session.access_token)}
            disabled={loading}
            className="rounded-full border border-line px-4 py-2 text-sm hover:border-gold disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="rounded-full border border-line px-4 py-2 text-sm text-muted hover:border-gold hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-300"
        >
          {error}
          <p className="mt-1">
            Verify your administrator role and database access.
          </p>
        </div>
      )}

      <section className="mt-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.label}
              className="rounded-2xl border border-line bg-panel p-5"
            >
              <p className="text-xs uppercase tracking-[0.16em] text-muted">
                {card.label}
              </p>

              <p className="mt-4 break-words font-serif text-2xl text-gold sm:text-3xl">
                {loading ? "Loading..." : card.value}
              </p>

              <p className="mt-2 text-xs text-muted">
                {card.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 rounded-2xl border border-line bg-panel p-5">
          <h2 className="font-serif text-2xl">
            Recent Orders
          </h2>

          <p className="mt-1 text-sm text-muted">
            Saved marketplace transactions.
          </p>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-3 py-3">Order</th>
                  <th className="px-3 py-3">Guitar</th>
                  <th className="px-3 py-3">Buyer</th>
                  <th className="px-3 py-3">Total</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-line/70"
                  >
                    <td className="px-3 py-4 text-muted">
                      {order.id.slice(0, 8)}
                    </td>

                    <td className="px-3 py-4">
                      {order.product
                        ? `${order.product.brand} ${order.product.model}`
                        : "Unavailable"}
                    </td>

                    <td className="px-3 py-4">
                      {order.buyer?.full_name ?? "Unknown"}
                    </td>

                    <td className="px-3 py-4 whitespace-nowrap">
                      {formatPeso(order.total_amount)}
                    </td>

                    <td className="px-3 py-4">
                      <span className="rounded-full border border-line px-2 py-1 text-xs text-gold">
                        {order.escrow_status.replace(/_/g, " ")}
                      </span>
                    </td>
                  </tr>
                ))}

                {!loading && orders.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-10 text-center text-muted"
                    >
                      No saved orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-panel p-5">
          <h2 className="font-serif text-2xl">
            Low-Stock Listings
          </h2>

          <p className="mt-1 text-sm text-muted">
            Guitars that need inventory attention.
          </p>

          <div className="mt-5 space-y-3">
            {metrics?.lowStockItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 border-b border-line pb-3"
              >
                <div>
                  <p className="text-sm">{item.name}</p>
                  <p className="mt-1 text-xs text-muted">
                    Product ID: {item.id.slice(0, 8)}
                  </p>
                </div>

                <span className="whitespace-nowrap text-sm text-gold">
                  {item.stock} left
                </span>
              </div>
            ))}

            {!loading && metrics?.lowStockItems.length === 0 && (
              <p className="py-6 text-sm text-muted">
                No low-stock listings found.
              </p>
            )}
          </div>
        </div>
      </section>

      <p className="mt-8 text-xs text-muted">
        Platform revenue remains pending until the approved
        commission and verification-fee fields are integrated.
      </p>
    </main>
  );
}
