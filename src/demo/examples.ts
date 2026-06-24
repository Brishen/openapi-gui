import {
  arrayNode,
  booleanNode,
  enumNode,
  integerNode,
  numberNode,
  objectNode,
  property,
  stringNode,
  unionNode,
  type SchemaNode,
} from '../react';

export const EXAMPLES: Record<string, () => SchemaNode> = {
  Person: () =>
    objectNode({
      title: 'Person',
      description: 'A simple person profile',
      properties: [
        property('name', stringNode({ description: 'Full name', examples: ['John Doe'] })),
        property('age', integerNode({ description: 'Age in years', minimum: 0, examples: [30] })),
        property('tags', arrayNode(stringNode({ description: 'A single tag', examples: ['developer'] }), { description: 'Freeform labels' })),
        property(
          'address',
          objectNode({
            description: 'Physical mailing address',
            properties: [
              property('city', stringNode({ description: 'City name', examples: ['New York'] })),
              property('zip', stringNode({ description: '5-digit postal code', pattern: '^[0-9]{5}$', examples: ['10001'] })),
            ],
          }),
        ),
      ],
    }),

  EcommerceOrder: () =>
    objectNode({
      title: 'Order',
      description: 'An e-commerce order representing purchased items',
      properties: [
        property('orderId', stringNode({ description: 'Unique identifier for the order', format: 'uuid', examples: ['123e4567-e89b-12d3-a456-426614174000'] })),
        property('customerEmail', stringNode({ description: 'Email address of the customer', format: 'email', examples: ['customer@example.com'] })),
        property('status', enumNode(['pending', 'shipped', 'delivered', 'cancelled'], { description: 'Current fulfillment status of the order', examples: ['pending'] })),
        property(
          'items',
          arrayNode(
            objectNode({
              description: 'A single item line in the order',
              properties: [
                property('productId', stringNode({ description: 'Unique product SKU', examples: ['PROD-992'] })),
                property('quantity', integerNode({ description: 'Number of items purchased', minimum: 1, examples: [2] })),
                property('unitPrice', numberNode({ description: 'Price per unit in USD', minimum: 0, examples: [19.99] })),
              ],
            }),
            { description: 'List of items in this order', minItems: 1 }
          )
        ),
        property('giftWrap', booleanNode({ description: 'True if order is a gift', examples: [false] }), false),
      ],
    }),

  Recipe: () =>
    objectNode({
      title: 'Recipe',
      description: 'A culinary recipe with ingredients and steps',
      properties: [
        property('title', stringNode({ description: 'Name of the dish', examples: ['Spaghetti Bolognese'] })),
        property('prepTimeMinutes', integerNode({ description: 'Estimated preparation time', minimum: 0, examples: [45] })),
        property(
          'ingredients',
          arrayNode(
            objectNode({
              description: 'A specific ingredient and its required amount',
              properties: [
                property('name', stringNode({ description: 'Name of the ingredient', examples: ['Tomato Paste'] })),
                property('amount', numberNode({ description: 'Numerical amount', examples: [2] })),
                property('unit', enumNode(['g', 'kg', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece'], { description: 'Unit of measurement', examples: ['tbsp'] })),
              ],
            }),
            { description: 'List of all required ingredients', minItems: 1 }
          )
        ),
        property(
          'instructions',
          arrayNode(stringNode({ description: 'A single cooking step', examples: ['Boil water.'] }), { minItems: 1, description: 'Step by step instructions' })
        ),
        property('isVegetarian', booleanNode({ description: 'Whether the dish is meat-free', examples: [false] })),
      ],
    }),

  ChatMessage: () =>
    objectNode({
      title: 'Message',
      description: 'A chat message that can contain either text or an image',
      properties: [
        property('id', stringNode({ description: 'Unique message identifier', format: 'uuid', examples: ['msg-55f'] })),
        property('timestamp', stringNode({ description: 'When the message was sent', format: 'date-time', examples: ['2023-10-15T12:00:00Z'] })),
        property(
          'content',
          unionNode([
            objectNode({
              title: 'TextMessage',
              description: 'A standard text message',
              properties: [
                property('type', enumNode(['text'], { description: 'Discriminator for text messages', examples: ['text'] })),
                property('text', stringNode({ description: 'The message body', minLength: 1, examples: ['Hello there!'] })),
              ],
            }),
            objectNode({
              title: 'ImageMessage',
              description: 'A message containing an image',
              properties: [
                property('type', enumNode(['image'], { description: 'Discriminator for image messages', examples: ['image'] })),
                property('imageUrl', stringNode({ description: 'URL to the image resource', format: 'uri', examples: ['https://example.com/image.png'] })),
                property('caption', stringNode({ description: 'Optional text describing the image', examples: ['A beautiful sunset'] }), false),
              ],
            }),
          ], { description: 'The payload of the message, which varies by type' })
        ),
      ],
    }),
};
