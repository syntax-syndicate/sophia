import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Chat, LlmMessage } from 'app/modules/admin/apps/chat/chat.types';
import {
    BehaviorSubject,
    Observable,
    filter,
    map,
    of,
    switchMap,
    take,
    tap,
    throwError,
} from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ChatService {
    private _chat: BehaviorSubject<Chat> = new BehaviorSubject(null);
    private _chats: BehaviorSubject<Chat[]> = new BehaviorSubject(null);

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for chat
     */
    get chat$(): Observable<Chat> {
        return this._chat.asObservable();
    }

    /**
     * Getter for chats
     */
    get chats$(): Observable<Chat[]> {
        return this._chats.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get chats
     */
    getChats(): Observable<any> {
        return this._httpClient.get<Chat[]>('/api/chats').pipe(
            tap((response: Chat[]) => {
                response = (response as any).data.chats
                this._chats.next(response);
            })
        );
    }

    createChat(message: string, llmId: string): Observable<Chat> {
        return this._httpClient.post<any>('/api/chat/new', { text: message, llmId }).pipe(
            map((response: any) => {
                const newChat: Chat = response.data;
                const currentChats = this._chats.value || [];
                this._chats.next([newChat, ...currentChats]);
                return newChat;
            })
        );
    }

    deleteChat(chatId: string): Observable<void> {
        return this._httpClient.delete<void>(`/api/chat/${chatId}`).pipe(
            tap(() => {
                const currentChats = this._chats.value || [];
                this._chats.next(currentChats.filter(chat => chat.id !== chatId));
            })
        );
    }

    /**
     * Get chat
     *
     * @param id
     */
    getChatById(id: string): Observable<any> {
        if(!id?.trim()) {
            console.log(`nullish chat id "${id}"`)
            const chat: Chat = {messages:[], id: null, title: ''}
            this._chat.next(chat);
            return this._chats
        }
        return this._httpClient
            .get<Chat>(`api/chat/${id}`)
            .pipe(
                map((chat: Chat) => {
                    // Update the chat
                    chat = (chat as any).data

                    chat = {
                        id: chat.id,
                        lastMessage: (chat.messages[chat.messages.length - 1] as any).text,
                        title: chat.title,
                        messages: chat.messages.map(msg => {
                            const llmMsg = msg as LlmMessage
                            return {
                                ...msg,
                                value: llmMsg.text,
                                isMine: llmMsg.role === 'user'
                            }
                        })
                    }
                    console.log(chat)
                    this._chat.next(chat);

                    // Return the chat
                    return chat;
                }),
                switchMap((chat: Chat) => {
                    // chat = (chat as any).data
                    if (!chat) {
                        return throwError(
                            'Could not found chat with id of ' + id + '!'
                        );
                    }

                    return of(chat);
                })
            );
    }

    /**
     * Update chat
     *
     * @param id
     * @param chat
     */
    updateChat(id: string, chat: Chat): Observable<Chat> {
        return this.chats$.pipe(
            take(1),
            switchMap((chats) =>
                this._httpClient
                    .patch<Chat>('api/apps/chat/chat', {
                        id,
                        chat,
                    })
                    .pipe(
                        map((updatedChat) => {
                            // Find the index of the updated chat
                            const index = chats.findIndex(
                                (item) => item.id === id
                            );

                            // Update the chat
                            chats[index] = updatedChat;

                            // Update the chats
                            this._chats.next(chats);

                            // Return the updated contact
                            return updatedChat;
                        }),
                        switchMap((updatedChat) =>
                            this.chat$.pipe(
                                take(1),
                                filter((item) => item && item.id === id),
                                tap(() => {
                                    // Update the chat if it's selected
                                    this._chat.next(updatedChat);

                                    // Return the updated chat
                                    return updatedChat;
                                })
                            )
                        )
                    )
            )
        );
    }

    /**
     * Update chat
     *
     * @param id
     * @param chat
     */
    updateChat2(id: string, chat: Chat): Observable<Chat> {
        return this.chats$.pipe(
            take(1),
            switchMap((chats) =>
                this._httpClient
                    .patch<Chat>('api/apps/chat/chat', {
                        id,
                        chat,
                    })
                    .pipe(
                        map((updatedChat) => {
                            // Find the index of the updated chat
                            const index = chats.findIndex(
                                (item) => item.id === id
                            );

                            // Update the chat
                            chats[index] = updatedChat;

                            // Update the chats
                            this._chats.next(chats);

                            // Update the chat if it's selected
                            this._chat.next(updatedChat);

                            // Return the updated chat
                            return updatedChat;
                        })
                    )
            )
        );
    }

    /**
     * Reset the selected chat
     */
    resetChat(): void {
        this._chat.next({ id: '', messages: [], title: '' });
    }


    /**
     * Send a message
     *
     * @param chatId
     * @param message
     * @param llmId LLM identifier
     */
    sendMessage(chatId: string, message: string, llmId: string): Observable<Chat> {
        return this.chats$.pipe(
            take(1),
            switchMap((chats) =>
                this._httpClient
                    .post<Chat>(`api/chat/${chatId}/send`, { text: message, llmId })
                    .pipe(
                        map((data: any) => {
                            const llmMessage = data.data;

                            const newMessages = [
                                {
                                    value: message,
                                    isMine: true,
                                },
                                {
                                    value: llmMessage,
                                    isMine: false,
                                },
                            ]
                            // // Find the index of the updated chat
                            const index = chats.findIndex(
                                (item) => item.id === chatId
                            );
                            //
                            // // Update the chat
                            const chat =  chats[index];
                            chat.messages.push(...newMessages);
                            // // Update the chats
                            this._chats.next(chats);
                            //
                            // // Update the chat if it's selected
                            this._chat.next(chat);
                            //
                            // // Return the updated chat
                            return chat;
                        })
                    )
            )
        );
    }

    /**
     * Send an audio message
     *
     * @param chatId
     * @param llmId
     * @param audio
     */
    sendAudioMessage(chatId: string, llmId: string, audio: Blob): Observable<Chat> {
        return this.chats$.pipe(
            take(1),
            switchMap((chats) =>
                this._httpClient
                    .post<Chat>(`api/chat/${chatId}/send`, { audio: audio, llmId })
                    .pipe(
                        map((data: any) => {
                            const llmMessage = data.data;

                            // const newMessages = [
                            //     {
                            //         value: message,
                            //         isMine: true,
                            //     },
                            //     {
                            //         value: llmMessage,
                            //         isMine: false,
                            //     },
                            // ]
                            // // Find the index of the updated chat
                            const index = chats.findIndex(
                                (item) => item.id === chatId
                            );
                            //
                            // // Update the chat
                            const chat =  chats[index];
                            // chat.messages.push(...newMessages);
                            // // Update the chats
                            this._chats.next(chats);
                            //
                            // // Update the chat if it's selected
                            this._chat.next(chat);
                            //
                            // // Return the updated chat
                            return chat;
                        })
                    )
            )
        );
    }
}