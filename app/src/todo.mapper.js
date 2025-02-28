const mapper = require('js-model-mapper');

const parseResponse = mapper([
    'completed',
    'created',
    'description',
    'id',
    'title', 
    {
        name: 'status',
        transform: (_, obj) => {
            if (obj.completed) return 'completed';
            return 'pending';
        }
    },
    'updatedAt'
]);

const parseRequest = mapper([
    'completed',
    'description',
    'title'
]);

module.exports = { parseRequest, parseResponse };