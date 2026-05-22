export async function post<T>(url: string, body?: any): Promise<T> {
    const res = await fetch(url, {
        method: "post",
        body: body ? JSON.stringify(body) : undefined,
        headers: { "Content-Type": "application/json" },
    });
    return res.json();
}
