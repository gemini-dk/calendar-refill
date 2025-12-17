const STRIPE_API_BASE = "https://api.stripe.com";
const DEFAULT_API_VERSION = "2024-11-20";

type RequestMethod = "GET" | "POST";

type StripeMetadata = Record<string, string>;

export type StripeCustomer = {
  id: string;
  email?: string | null;
  metadata?: StripeMetadata;
};

export type StripeCustomerSearchResponse = {
  data: StripeCustomer[];
};

export type StripeCheckoutSession = {
  id: string;
  url?: string | null;
};

type StripeLineItem = {
  price: string;
  quantity?: number;
};

type StripeCheckoutSessionParams = {
  customer?: string;
  mode: "payment";
  line_items: StripeLineItem[];
  metadata?: StripeMetadata;
  success_url: string;
  cancel_url: string;
};

type StripeCustomerSearchParams = {
  query: string;
  limit?: number;
};

type StripeCustomerCreateParams = {
  email?: string;
  metadata?: StripeMetadata;
};

export default class Stripe {
  private readonly apiKey: string;
  private readonly apiVersion: string;

  constructor(apiKey: string, apiVersion = DEFAULT_API_VERSION) {
    if (!apiKey) {
      throw new Error("Stripe API key is required");
    }

    this.apiKey = apiKey;
    this.apiVersion = apiVersion;
  }

  private async request<T>(
    method: RequestMethod,
    path: string,
    data?: Record<string, unknown>,
  ): Promise<T> {
    let url = `${STRIPE_API_BASE}${path}`;
    let body: string | undefined;

    if (data) {
      const encoded = this.encodeFormData(data);

      if (method === "GET") {
        url = `${url}?${encoded}`;
      } else {
        body = encoded;
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Stripe-Version": this.apiVersion,
    };

    if (body) {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
    }

    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Stripe API error ${response.status}: ${errorText}`);
    }

    return (await response.json()) as T;
  }

  private encodeFormData(data: Record<string, unknown>) {
    const entries: [string, string][] = [];

    const appendEntry = (key: string, value: unknown) => {
      if (value === undefined || value === null) return;

      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          appendEntry(`${key}[${index}]`, item);
        });
        return;
      }

      if (typeof value === "object") {
        Object.entries(value as Record<string, unknown>).forEach(([childKey, childValue]) => {
          appendEntry(`${key}[${childKey}]`, childValue);
        });
        return;
      }

      entries.push([key, String(value)]);
    };

    Object.entries(data).forEach(([key, value]) => appendEntry(key, value));

    return new URLSearchParams(entries).toString();
  }

  public customers = {
    search: (params: StripeCustomerSearchParams) =>
      this.request<StripeCustomerSearchResponse>("GET", "/v1/customers/search", params),
    create: (params: StripeCustomerCreateParams) =>
      this.request<StripeCustomer>("POST", "/v1/customers", params),
  };

  public checkout = {
    sessions: {
      create: (params: StripeCheckoutSessionParams) =>
        this.request<StripeCheckoutSession>("POST", "/v1/checkout/sessions", params),
    },
  };
}
