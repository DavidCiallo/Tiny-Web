function authHeader(): Record<string, string> {
    const token = localStorage.getItem("access_token");
    return token ? { Token: token } : {};
}

export async function post<T>(url: string, body?: any): Promise<T> {
    const res = await fetch(url, {
        method: "post",
        body: body ? JSON.stringify(body) : undefined,
        headers: {
            "Content-Type": "application/json",
            ...authHeader(),
        },
    });
    return res.json();
}
