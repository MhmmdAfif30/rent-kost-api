const setResponse = (data = null, message = "success", statusCode = 200) => {
    const total = Array.isArray(data) ? data.length : null;

    return {
        message,
        statusCode,
        rows: total,
        data,
    };
};

const setResponsePaging = async (queryParam, data = [], message = "success", statusCode = 200) => {

    const totalPages = Math.ceil(data?.total / Number(queryParam.limit ?? 0));

    const response = {
        message,
        statusCode,
        rows: data?.data?.length,
        paging: {
            current_limit: Number(queryParam.limit ?? 0),
            current_page: Number(queryParam.page ?? 0),
            total_limit: data?.total,
            total_page: totalPages
        },
        data: data?.data ?? []
    }

    return response
};

// function convertId(items, id, fieldId = "id", fieldName = "name") {
//   var match = ""
//   items.forEach(element => {
//     if (element[fieldId] == id) {
//       match = element[fieldName]
//     }
//   });

//   return match
// }

function formatToYYYYMMDD(date) {
    return new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date).split('/').reverse().join('-');
}

// function ensureArray(param) {
//     return Array.isArray(param) ? param : [param];
// }

function orderByClauseQuery(orderParams) {
    orderParams = ensureArray(orderParams)

    // Transform order parameters to SQL ORDER BY syntax
    const validDirections = ['ASC', 'DESC'];
    const orderConditions = orderParams.map(param => {
        const [field, direction] = param.split(':');
        if (!validDirections.includes(direction.toUpperCase())) {
            throw new Error(`Invalid direction: ${direction}`);
        }
        return `${field} ${direction}`;
    });

    // Gabungkan dengan koma untuk digunakan dalam query
    const orderByClause = orderConditions.join(', ');

    return orderByClause
}

const checkValidate = (validateSchema, req) => {
    const { error, value } = validateSchema.validate(req.body || {}, { abortEarly: false });
    if (error) {
        const errors = error.details.reduce((acc, cur) => {
            const field = Array.isArray(cur.path) ? cur.path.join('.') : String(cur.path);
            if (!acc[field]) acc[field] = [];
            acc[field].push(cur.message);
            return acc;
        }, {});
        return { error: errors, value }
    }

    return { error, value }
}

module.exports = { setResponse, setResponsePaging, formatToYYYYMMDD, orderByClauseQuery, checkValidate };
