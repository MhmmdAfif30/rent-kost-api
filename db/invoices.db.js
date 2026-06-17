const pool = require("../config");

// Get all invoices
const getAllInvoicesDb = async (searchParams = {}) => {
    let queryParams = [];

    // Search
    const { whereOrConditions, whereParamOr } = pool.buildStringOrIlike(
        ["c.fullname", "c.username", "c.email"],
        searchParams.criteria,
        queryParams
    );
    queryParams = whereParamOr || queryParams;

    // Filter
    const { whereConditions, whereParamAnd } = pool.buildFilterQuery(
        [
            { column: "c.fullname", param: searchParams.fullname, type: "string" },
            { column: "c.username", param: searchParams.username, type: "string" },
            { column: "c.email", param: searchParams.email, type: "string" },
        ],
        queryParams
    );
    queryParams = whereParamAnd || queryParams;

    const conditions = [];
    if (whereConditions && whereConditions.length > 0) {
        conditions.push(`(${whereConditions.join(' AND ')})`);
    }
    if (whereOrConditions) {
        conditions.push(whereOrConditions.replace(/^\s*AND\s*/i, ''));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let paginationClause = '';
    if (searchParams.limit) {
        const limitValue = Number(searchParams.limit) || 10;
        const page = Math.max(0, Number(searchParams.page) - 1) || 0;
        const offsetValue = page * limitValue;

        paginationClause = `LIMIT ${limitValue} OFFSET ${offsetValue}`;
    }

    const queryText = `
        SELECT 
            COUNT(*) OVER() AS total_data, 
            a.*
        FROM invoices a
        ${whereClause}
        ORDER BY a.invoices_id DESC
        ${paginationClause}
    `;

    const result = await pool.query(queryText, queryParams);

    const total = result?.recordset?.length > 0 
        ? parseInt(result.recordset[0].total_data, 10) 
        : 0;

    return { 
        data: result?.recordset || [], 
        total 
    };
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
     b.fullname as customer_name, 
     b.email as customer_email, 
     b.contact_phone as customer_phone

    FROM invoices  a

    LEFT JOIN users b ON a.users_id = b.users_id

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