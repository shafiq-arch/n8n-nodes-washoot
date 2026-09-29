import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

export class Washoot implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Washoot',
		name: 'washoot',
		icon: 'file:washoot.svg',
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Send WhatsApp messages and manage contacts via Washoot',
		defaults: {
			name: 'Washoot',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'washootApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: '={{$credentials.baseUrl}}',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': '={{$credentials.apiKey}}',
			},
		},
		properties: [
			// Resource selector
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Message', value: 'message' },
					{ name: 'Contact', value: 'contact' },
					{ name: 'Session', value: 'session' },
				],
				default: 'message',
			},

			// ── MESSAGE operations ────────────────────────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['message'] } },
				options: [
					{
						name: 'Send Text',
						value: 'sendText',
						description: 'Send a text message to a phone number',
						action: 'Send a text message',
					},
					{
						name: 'Send Media',
						value: 'sendMedia',
						description: 'Send an image, document or video',
						action: 'Send a media message',
					},
				],
				default: 'sendText',
			},

			// Send Text fields
			{
				displayName: 'To (Phone Number)',
				name: 'to',
				type: 'string',
				required: true,
				default: '',
				placeholder: '919876543210',
				description: 'Phone number with country code (no + or spaces). E.g. 919876543210 for India.',
				displayOptions: { show: { resource: ['message'], operation: ['sendText', 'sendMedia'] } },
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				typeOptions: { rows: 4 },
				required: true,
				default: '',
				placeholder: 'Hello {{name}}, your order is ready!',
				description: 'Message text to send. Supports *bold*, _italic_, ~strikethrough~.',
				displayOptions: { show: { resource: ['message'], operation: ['sendText'] } },
			},
			{
				displayName: 'Media URL',
				name: 'mediaUrl',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'https://example.com/image.jpg',
				description: 'URL of the image, document or video to send.',
				displayOptions: { show: { resource: ['message'], operation: ['sendMedia'] } },
			},
			{
				displayName: 'Caption',
				name: 'mediaCaption',
				type: 'string',
				default: '',
				description: 'Optional caption for the media.',
				displayOptions: { show: { resource: ['message'], operation: ['sendMedia'] } },
			},
			{
				displayName: 'Session ID (Optional)',
				name: 'sessionId',
				type: 'string',
				default: '',
				description: 'Specific WhatsApp session to use. Leave blank to use first connected session.',
				displayOptions: { show: { resource: ['message'], operation: ['sendText', 'sendMedia'] } },
			},

			// ── CONTACT operations ────────────────────────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['contact'] } },
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Add a new contact',
						action: 'Create a contact',
					},
					{
						name: 'Get All',
						value: 'getAll',
						description: 'Get all contacts',
						action: 'Get all contacts',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a contact',
						action: 'Update a contact',
					},
				],
				default: 'create',
			},

			// Contact fields
			{
				displayName: 'Phone Number',
				name: 'phone',
				type: 'string',
				required: true,
				default: '',
				placeholder: '919876543210',
				description: 'Phone number with country code.',
				displayOptions: { show: { resource: ['contact'], operation: ['create', 'update'] } },
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['contact'], operation: ['create', 'update'] } },
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				displayOptions: { show: { resource: ['contact'], operation: ['create', 'update'] } },
			},
			{
				displayName: 'Tags',
				name: 'tags',
				type: 'string',
				default: '',
				placeholder: 'vip, repeat-buyer',
				description: 'Comma-separated tags.',
				displayOptions: { show: { resource: ['contact'], operation: ['create', 'update'] } },
			},
			{
				displayName: 'City',
				name: 'city',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['contact'], operation: ['create', 'update'] } },
			},
			{
				displayName: 'Notes',
				name: 'notes',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['contact'], operation: ['create', 'update'] } },
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				description: 'Max number of contacts to return.',
				displayOptions: { show: { resource: ['contact'], operation: ['getAll'] } },
			},

			// ── SESSION operations ────────────────────────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['session'] } },
				options: [
					{
						name: 'Get All',
						value: 'getAll',
						description: 'Get all WhatsApp sessions and their status',
						action: 'Get all sessions',
					},
				],
				default: 'getAll',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('washootApi');
		const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');
		const apiKey = credentials.apiKey as string;

		const headers = {
			'Content-Type': 'application/json',
			'x-api-key': apiKey,
		};

		for (let i = 0; i < items.length; i++) {
			const resource = this.getNodeParameter('resource', i) as string;
			const operation = this.getNodeParameter('operation', i) as string;

			let responseData: any;

			try {
				// ── MESSAGE ──────────────────────────────────────────────
				if (resource === 'message') {
					if (operation === 'sendText') {
						const to        = this.getNodeParameter('to', i) as string;
						const message   = this.getNodeParameter('message', i) as string;
						const sessionId = this.getNodeParameter('sessionId', i) as string;

						const body: any = { to, message };
						if (sessionId) body.session_id = sessionId;

						const response = await this.helpers.httpRequest({
							method: 'POST',
							url: `${baseUrl}/api/v1/send`,
							headers,
							body,
							json: true,
						});
						responseData = response;
					}

					if (operation === 'sendMedia') {
						const to           = this.getNodeParameter('to', i) as string;
						const mediaUrl     = this.getNodeParameter('mediaUrl', i) as string;
						const mediaCaption = this.getNodeParameter('mediaCaption', i) as string;
						const sessionId    = this.getNodeParameter('sessionId', i) as string;

						const body: any = { to, media_url: mediaUrl, media_caption: mediaCaption };
						if (sessionId) body.session_id = sessionId;

						const response = await this.helpers.httpRequest({
							method: 'POST',
							url: `${baseUrl}/api/v1/send`,
							headers,
							body,
							json: true,
						});
						responseData = response;
					}
				}

				// ── CONTACT ──────────────────────────────────────────────
				if (resource === 'contact') {
					if (operation === 'create' || operation === 'update') {
						const phone = this.getNodeParameter('phone', i) as string;
						const name  = this.getNodeParameter('name', i) as string;
						const email = this.getNodeParameter('email', i) as string;
						const tags  = this.getNodeParameter('tags', i) as string;
						const city  = this.getNodeParameter('city', i) as string;
						const notes = this.getNodeParameter('notes', i) as string;

						const body: any = { phone };
						if (name)  body.name  = name;
						if (email) body.email = email;
						if (tags)  body.tags  = tags.split(',').map((t: string) => t.trim()).filter(Boolean);
						if (city)  body.city  = city;
						if (notes) body.notes = notes;

						const response = await this.helpers.httpRequest({
							method: 'POST',
							url: `${baseUrl}/api/contacts`,
							headers,
							body,
							json: true,
						});
						responseData = response;
					}

					if (operation === 'getAll') {
						const limit = this.getNodeParameter('limit', i) as number;
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/api/contacts?limit=${limit}`,
							headers,
							json: true,
						});
						responseData = response;
					}
				}

				// ── SESSION ──────────────────────────────────────────────
				if (resource === 'session') {
					if (operation === 'getAll') {
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/api/v1/sessions`,
							headers,
							json: true,
						});
						responseData = response;
					}
				}

				// Handle array responses
				if (Array.isArray(responseData?.data)) {
					returnData.push(...responseData.data.map((item: any) => ({ json: item })));
				} else {
					returnData.push({ json: responseData });
				}

			} catch (error: any) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message }, pairedItem: i });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
