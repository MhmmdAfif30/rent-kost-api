const pool = require("../config");

// Get all invoices
const getAllInvoicesDb = async (searchParams = {}) => {
    let queryParams = [];

    // Search
    /*
    const { whereOrConditions, whereParamOr } = pool.buildStringOrIlike(
        ["u.fullname", "u.username", "u.email", "ur.role_name"],
        searchParams.criteria,
        queryParams
    );
    queryParams = whereParamOr ? whereParamOr : queryParams;

    // Filter
    const { whereConditions, whereParamAnd } = pool.buildFilterQuery(
        [
            { column: "u.fullname", param: searchParams.fullname, type: "string" },
            { column: "u.username", param: searchParams.username, type: "string" },
            { column: "u.email", param: searchParams.email, type: "string" },
            { column: "ur.role_name", param: searchParams.role, type: "string" },
        ],
        queryParams
    );
    queryParams = whereParamAnd ? whereParamAnd : queryParams;
    */

    const conditions = [];
    if (typeof whereConditions !== 'undefined' && whereConditions.length > 0) {
        conditions.push(`(${whereConditions.join(' AND ')})`);
    }
    if (typeof whereOrConditions !== 'undefined' && whereOrConditions) {
        conditions.push(whereOrConditions.replace(/^\s*AND\s*/i, ''));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let paginationClause = '';
    if (searchParams.limit) {
        const limitValue = Number(searchParams.limit ?? 10);
        const page = Number(searchParams.page ?? 1) - 1;
        const offsetValue = page * limitValue;

        paginationClause = `LIMIT ${limitValue} OFFSET ${offsetValue}`;
    }

    const queryText = `

    SELECT 
      COUNT(*) OVER() AS total_data,

    FROM invoices  a

    ${whereClause}
    ORDER BY a.invoices_id ASC
    ${paginationClause}
  `;

    const result = await pool.query(queryText, queryParams);

    const total =
        result?.recordset && result.recordset.length > 0
            ? parseInt(result.recordset[0].total_data, 10)
            : 0;

    return { data: result.recordset, total };
};

// Get invoice by ID
const getInvoicesByIdDb = async (id) => {
    const queryText = `

    SELECT 
     a.invoices_id, 
     a.is_due_date, 
     a.amount, 
     a.quantity, 
     a.fee, 
     a.total, 
     a.is_active,
     c.start_date, 
     c.end_date, 
     d.fullname as customer_name, 
     d.email as customer_email, 
     d.contact_phone as customer_phone

    FROM invoices  a

    LEFT JOIN contracts c ON a.contracts_id = c.contracts_id

    LEFT JOIN users d ON c.users_id = d.users_id

    WHERE a.invoices_id = $1
  `;
    const result = await pool.query(queryText, [id]);
    return result.recordset[0] || null;
}


// Create invoice
const createInvoicesDb = async (data) => {
    const { query: queryText, values } = pool.buildDynamicInsert("invoices", data);
    const result = await pool.query(queryText, values);
    const insertedId = result.insertId;
    return insertedId ? await getInvoicesByIdDb(insertedId) : null;
};

// Update invoice
const updateInvoicesDb = async (invoicesId, data) => {
    const { query: queryText, values } = pool.buildDynamicUpdate("invoices", data, {
        invoices_id: invoicesId,
    });
    await pool.query(`${queryText}`, values);
    return getInvoicesByIdDb(invoicesId);
};

// Delete invoice
const deleteInvoicesDb = async (invoicesId,) => {

    const queryText = `
    UPDATE invoices

    SET 
      is_active = 0
      
    WHERE invoices_id = $2 
  `;
    await pool.query(queryText, [invoicesId]);
    return true;
};


module.exports = {
    getAllInvoicesDb,
    getInvoicesByIdDb,
    createInvoicesDb,
    updateInvoicesDb,
    deleteInvoicesDb,
};