import {
	IHookFunctions,
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
} from 'n8n-workflow';

export class WashootTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Washoot Trigger',
		name: 'washootTrigger',
		icon: 'file:washoot.svg',
		group: ['trigger'],
		version: 1,
		description: 'Starts the workflow when a Washoot event occurs (message received, order placed, abandoned cart, etc.)',
		defaults: {
			name: 'Washoot Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'washootApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: ['message.received'],
				options: [
					{
						name: 'Message Received',
						value: 'message.received',
						description: 'When a customer sends a WhatsApp message',
					},
					{
						name: 'Order Created',
						value: 'order.created',
						description: 'When a new WooCommerce order is placed',
					},
					{
						name: 'Order Updated',
						value: 'order.updated',
						description: 'When a WooCommerce order status changes',
					},
					{
						name: 'Abandoned Cart',
						value: 'cart.abandoned',
						description: 'When a cart is detected as abandoned',
					},
					{
						name: 'Cart Recovered',
						value: 'cart.recovered',
						description: 'When an abandoned cart is recovered (order placed)',
					},
					{
						name: 'Campaign Sent',
						value: 'campaign.sent',
						description: 'When a campaign message is sent',
					},
				],
			},
			{
				displayName: 'Webhook Name',
				name: 'webhookName',
				type: 'string',
				default: 'n8n Webhook',
				description: 'Label for this webhook in your Washoot dashboard.',
			},
		],
	};

	// Register webhook in Washoot when workflow activates
	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (!webhookData.webhookId) return false;

				const credentials = await this.getCredentials('washootApi');
				const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');

				try {
					const response = await this.helpers.httpRequest({
						method: 'GET',
						url: `${baseUrl}/api/v1/webhooks`,
						headers: { 'x-api-key': credentials.apiKey as string },
						json: true,
					});
					const webhooks = response.data || [];
					return webhooks.some((w: any) => w.id === webhookData.webhookId);
				} catch {
					return false;
				}
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl   = this.getNodeWebhookUrl('default');
				const events       = this.getNodeParameter('events') as string[];
				const webhookName  = this.getNodeParameter('webhookName') as string;
				const credentials  = await this.getCredentials('washootApi');
				const baseUrl      = (credentials.baseUrl as string).replace(/\/$/, '');

				const response = await this.helpers.httpRequest({
					method: 'POST',
					url: `${baseUrl}/api/v1/webhooks`,
					headers: {
						'Content-Type': 'application/json',
						'x-api-key': credentials.apiKey as string,
					},
					body: {
						name:   webhookName || 'n8n Webhook',
						url:    webhookUrl,
						events,
					},
					json: true,
				});

				if (!response?.data?.id) return false;

				const webhookData = this.getWorkflowStaticData('node');
				webhookData.webhookId     = response.data.id;
				webhookData.webhookSecret = response.data.secret;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (!webhookData.webhookId) return true;

				const credentials = await this.getCredentials('washootApi');
				const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');

				try {
					await this.helpers.httpRequest({
						method: 'DELETE',
						url: `${baseUrl}/api/v1/webhooks/${webhookData.webhookId}`,
						headers: { 'x-api-key': credentials.apiKey as string },
						json: true,
					});
					delete webhookData.webhookId;
					delete webhookData.webhookSecret;
				} catch {
					return false;
				}
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData();
		return {
			workflowData: [[{ json: body as any }]],
		};
	}
}
