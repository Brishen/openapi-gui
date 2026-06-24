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
        property('name', stringNode({ description: 'Full name' })),
        property('age', integerNode({ description: 'Age in years', minimum: 0 })),
        property('tags', arrayNode(stringNode(), { description: 'Freeform labels' })),
        property(
          'address',
          objectNode({
            properties: [
              property('city', stringNode()),
              property('zip', stringNode({ pattern: '^[0-9]{5}$' })),
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
        property('orderId', stringNode({ format: 'uuid' })),
        property('customerEmail', stringNode({ format: 'email' })),
        property('status', enumNode(['pending', 'shipped', 'delivered', 'cancelled'])),
        property(
          'items',
          arrayNode(
            objectNode({
              properties: [
                property('productId', stringNode()),
                property('quantity', integerNode({ minimum: 1 })),
                property('unitPrice', numberNode({ minimum: 0 })),
              ],
            }),
            { minItems: 1 }
          )
        ),
        property('giftWrap', booleanNode({ description: 'True if order is a gift' }), false),
      ],
    }),

  Recipe: () =>
    objectNode({
      title: 'Recipe',
      description: 'A culinary recipe with ingredients and steps',
      properties: [
        property('title', stringNode({ description: 'Name of the dish' })),
        property('prepTimeMinutes', integerNode({ minimum: 0 })),
        property(
          'ingredients',
          arrayNode(
            objectNode({
              properties: [
                property('name', stringNode()),
                property('amount', numberNode()),
                property('unit', enumNode(['g', 'kg', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece'])),
              ],
            }),
            { minItems: 1 }
          )
        ),
        property(
          'instructions',
          arrayNode(stringNode(), { minItems: 1, description: 'Step by step instructions' })
        ),
        property('isVegetarian', booleanNode()),
      ],
    }),

  ChatMessage: () =>
    objectNode({
      title: 'Message',
      description: 'A chat message that can contain either text or an image',
      properties: [
        property('id', stringNode({ format: 'uuid' })),
        property('timestamp', stringNode({ format: 'date-time' })),
        property(
          'content',
          unionNode([
            objectNode({
              title: 'TextMessage',
              properties: [
                property('type', enumNode(['text'])),
                property('text', stringNode({ minLength: 1 })),
              ],
            }),
            objectNode({
              title: 'ImageMessage',
              properties: [
                property('type', enumNode(['image'])),
                property('imageUrl', stringNode({ format: 'uri' })),
                property('caption', stringNode(), false),
              ],
            }),
          ])
        ),
      ],
    }),
};
