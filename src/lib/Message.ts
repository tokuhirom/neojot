export type Message = {
    id: string,
    replyTo: string | null,
    replyCount: number,
    createdSeconds: number,
    body: string,
}
