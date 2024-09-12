import { expect } from 'chai';
import sinon from 'sinon';
import { Chat, ChatService } from '#chat/chatTypes';

export function runChatServiceTests(createService: () => ChatService) {
	let service: ChatService;

	beforeEach(() => {
		service = createService();
	});

	it('should save and load a chat', async () => {
		const sampleChat: Chat = {
			id: 'test-chat-id',
			messages: [
				{ role: 'user', text: 'Hello' },
				{ role: 'assistant', text: 'Hi there! How can I help you?' },
			],
			lastUpdated: Date.now(),
			userId: 'user-id',
			visibility: 'private',
			title: 'test',
			parentId: undefined,
		};

		// Save the chat
		const savedChat = await service.saveChat(sampleChat);

		// Load the chat
		const loadedChat = await service.loadChat(sampleChat.id);

		// Verify that the loaded chat matches the saved chat
		expect(loadedChat).to.deep.equal(savedChat);
		expect(loadedChat).to.deep.equal(sampleChat);
	});

	it('should save a chat with an empty message array', async () => {
		const emptyChatId = 'empty-chat-id';
		const emptyChat: Chat = {
			id: emptyChatId,
			userId: 'user-id',
			title: 'test',
			visibility: 'private',
			messages: [],
			lastUpdated: Date.now(),
			parentId: undefined,
		};

		const savedChat = await service.saveChat(emptyChat);
		expect(savedChat).to.deep.equal(emptyChat);

		const loadedChat = await service.loadChat(emptyChatId);
		expect(loadedChat).to.deep.equal(emptyChat);
	});

	it('should handle a chat with parentId', async () => {
		const parentChat: Chat = {
			id: 'parent-chat-id',
			userId: 'user-id',
			visibility: 'private',
			title: 'test',
			messages: [{ role: 'user', text: 'Parent message' }],
			lastUpdated: Date.now(),
			parentId: undefined,
		};

		const childChat: Chat = {
			id: 'child-chat-id',
			userId: 'user-id',
			visibility: 'private',
			parentId: parentChat.id,
			title: 'test',
			lastUpdated: Date.now(),
			messages: [{ role: 'assistant', text: 'Child message' }],
		};

		await service.saveChat(parentChat);
		await service.saveChat(childChat);

		const loadedChildChat = await service.loadChat(childChat.id);
		expect(loadedChildChat).to.deep.equal(childChat);
	});

	describe.skip('listChats', () => {
		it('should list chats with pagination', async () => {
			const chats: Chat[] = [
				{ id: 'chat1', userId: 'user1', title: 'Chat 1', visibility: 'private', messages: [], parentId: undefined, lastUpdated: Date.now() },
				{ id: 'chat2', userId: 'user1', title: 'Chat 2', visibility: 'private', messages: [], parentId: undefined, lastUpdated: Date.now() },
				{ id: 'chat3', userId: 'user1', title: 'Chat 3', visibility: 'private', messages: [], parentId: undefined, lastUpdated: Date.now() },
			];

			for (const chat of chats) {
				await service.saveChat(chat);
			}

			const result1 = await service.listChats();
			expect(result1.chats).to.have.lengthOf(2);
			expect(result1.hasMore).to.be.true;

			const result2 = await service.listChats();
			expect(result2.chats).to.have.lengthOf(1);
			expect(result2.hasMore).to.be.false;
		});

		it('should return an empty array when no chats are available', async () => {
			const result = await service.listChats();
			expect(result.chats).to.be.an('array').that.is.empty;
			expect(result.hasMore).to.be.false;
		});
	});
}