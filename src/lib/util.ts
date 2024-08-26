
export function CloneArray<T>(array: T[]): T[] {
    const new_array = []
    for (const data of array) {
        let new_data: unknown;
        switch (typeof data) {
            case "number":
                new_data = data;
                break;
            case "boolean":
                new_data = data;
                break;
            case "string":
                new_data = `${data}`;
                break;
            case "object":
                new_data = structuredClone(data);
                break;
            default:
                if (Array.isArray(data)) {
                    new_data = CloneArray(data);
                }
        }
        new_array.push(new_data);
    }
    return new_array as T[];
}