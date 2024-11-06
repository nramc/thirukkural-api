export interface KuralsDb {
    kurals: Kural[]
}

export interface Kural {
    number: number,
    "section": string,
    chapter: string,
    "kural": string[],
    meaning: { [name: string]: string }
}