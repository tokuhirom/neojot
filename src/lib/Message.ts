export type Message = {
    id: string,
    replies: Message[],
    createdSeconds: number,
    body: string,
}
