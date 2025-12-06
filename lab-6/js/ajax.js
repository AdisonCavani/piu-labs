export class Ajax {
  constructor(options) {
    this.options = options;
  }

  async get(url, options) {
    const headers = new Headers(options?.headers);

    return await this.fetch(url, "GET", headers, null, options?.baseURL);
  }

  async post(url, data, options) {
    const headers = new Headers(options?.headers);

    return await this.fetch(
      url,
      "POST",
      headers,
      JSON.stringify(data),
      options?.baseURL
    );
  }

  async put(url, data, options) {
    const headers = new Headers(options?.headers);

    return await this.fetch(
      url,
      "PUT",
      headers,
      JSON.stringify(data),
      options?.baseURL
    );
  }
  async delete(url, options) {
    const headers = new Headers(options?.headers);

    return await this.fetch(url, "DELETE", headers, null, options?.baseURL);
  }

  async fetch(newUrl, method, newHeaders, body, baseURL) {
    const headers = new Headers(this.options?.headers);

    if (newHeaders) {
      newHeaders.forEach((v, k) => headers.set(k, v));
    }

    headers.set("Content-Type", "application/json");

    const timeout = this.options?.timeout ?? 5000;

    let url = newUrl;

    if (baseURL) url = baseURL + newUrl;
    else if (this.options?.baseURL) url = this.options?.baseURL + newUrl;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    let response;

    try {
      response = await fetch(url, {
        method: method,
        headers: headers,
        body: body ?? null,
        signal: controller.signal,
      });
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error(
          JSON.stringify(
            {
              message: "Fetch timeout",
              url,
              method,
              timeout,
            },
            null,
            2
          )
        );
      }

      throw error;
    } finally {
      clearTimeout(timer);
    }

    const text = await response.text();

    if (response.ok) return text ? JSON.parse(text) : null;

    const errorObj = {
      message: "Fetch failed",
      url,
      method,
      statusCode: response.status,
      statusText: response.statusText,
      ...(text.length > 0 && { reason: text }),
    };

    throw new Error(JSON.stringify(errorObj, null, 2));
  }
}
