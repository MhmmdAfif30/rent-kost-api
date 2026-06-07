const pool = require("../config");

// Get all contracts
const getAllContractsDb = async (searchParams = {}) => {
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

    FROM contracts a

    ${whereClause}
    ORDER BY a.contracts_id ASC
    ${paginationClause}
  `;

    const result = await pool.query(queryText, queryParams);

    const total =
        result?.recordset && result.recordset.length > 0
            ? parseInt(result.recordset[0].total_data, 10)
            : 0;

    return { data: result.recordset, total };
};

// Get contract by ID
const getContractsByIdDb = async (id) => {
    const queryText = `

    SELECT 
      a.users_id, a.start_date, a.end_date, a.is_active

    FROM contracts a

    WHERE a.contracts_id = $1
  `;
    const result = await pool.query(queryText, [id]);
    return result.recordset[0] || null;
};


// Create contract
const createContractsDb = async (data) => {
    const { query: queryText, values } = pool.buildDynamicInsert("contracts", data);
    const result = await pool.query(queryText, values);
    const insertedId = result.insertId;
    return insertedId ? await getContractsByIdDb(insertedId) : null;
};

// Update contract
const updateContractsDb = async (contractsId, data) => {
    const { query: queryText, values } = pool.buildDynamicUpdate("contracts", data, {
        contracts_id: contractsId,
    });
    await pool.query(`${queryText}`, values);
    return getContractsByIdDb(contractsId);
};

// Delete contract
const deleteContractsDb = async (contractsId,) => {

    const queryText = `
    UPDATE contracts

    SET 
      is_active = 0
      
    WHERE contracts_id = $2 
  `;
    await pool.query(queryText, [contractsId]);
    return true;
};

module.exports = {
    getAllContractsDb,
    getContractsByIdDb,
    createContractsDb,
    updateContractsDb,
    deleteContractsDb,
};