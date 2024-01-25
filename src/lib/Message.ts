export type Message = {
    id: string,
    replyTo: string | null,
    createdSeconds: number,
    body: string,
}
