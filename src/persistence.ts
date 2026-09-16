export async function getJson(key: string) {
    const value = await GM.getValue(key, null);

    return value ? JSON.parse(value) : null;
}

export async function setJson(key: string, value: any) {
    await GM.setValue(key, JSON.stringify(value));
}

export async function getString(key: string) {
    const value = await GM.getValue(key, null);

    return value ? String(value) : null;
}

export async function setString(key: string, value: any) {
    await GM.setValue(key, value);
}

export async function remove(key: string) {
    await GM.setValue(key, null);
}
