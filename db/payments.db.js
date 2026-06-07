const pool = require("../config");

const getAllPaymentsDb = async (searchParams = {}) => {
    let queryParams = [];

    //  Pagination
    // if (searchParams.limit) {
    //     const page = Number(searchParams.page ?? 1) - 1;
    //     queryParams = [Number(searchParams.limit ?? 10), page];
    // }

    // const { whereOrConditions, whereParamOr } = pool.buildStringOrIlike(
    //     ["a.role_name"],
    //     searchParams.criteria,
    //     queryParams
    // );
    // if (whereParamOr) queryParams = whereParamOr;

    // const { whereConditions, whereParamAnd } = pool.buildFilterQuery(
    //     [
    //         { column: "a.role_name", param: searchParams.role_name, type: "string" },
    //     ],
    //     queryParams
    // );
    // if (whereParamAnd) queryParams = whereParamAnd;

    const queryText = `

    SELECT 
      COUNT(*) OVER() AS total_data, 
      a.*

    FROM payments a

      ${whereConditions.length > 0 ? ` AND ${whereConditions.join(" AND ")}` : ""}
      ${whereOrConditions ? ` ${whereOrConditions}` : ""}

    ORDER BY a.payments_id ASC
    ${searchParams.limit ? `OFFSET $2 * $1 ROWS FETCH NEXT $1 ROWS ONLY` : ''}
  `;

    const result = await pool.query(queryText, queryParams);
    const total =
        result?.recordset?.length > 0
            ? parseInt(result.recordset[0].total_data, 10)
            : 0;

    return { data: result.recordset, total };
};

const getPaymentsByIdDb = async (id) => {
    const queryText = `

    SELECT 
      a.*
    FROM payments a

    WHERE a.payments_id = $1
  `;
    const result = await pool.query(queryText, [id]);
    return result.recordset?.[0] || null;
};

const insertPaymentsDb = async (store) => {
    const { query: queryText, values } = pool.buildDynamicInsert("payments", store);
    const result = await pool.query(queryText, values);
    const insertedId = result.recordset?.[0]?.inserted_id;

    return insertedId ? await getPaymentsByIdDb(insertedId) : null;
};

const updatePaymentsDb = async (id, data) => {
    const store = { ...data };
    const whereData = { payments_id: id };

    const { query: queryText, values } = pool.buildDynamicUpdate(
        "payments",
        store,
        whereData
    );

    await pool.query(`${queryText}`, values);
    return getPaymentsByIdDb(id);
};

const deletePaymentsDb = async (id, deletedBy) => {
    const queryText = `
    UPDATE payments
    WHERE payments_id = $2 
  `;
    await pool.query(queryText, [deletedBy, id]);
    return true;
};

const approvePaymentsDb = async (paymentId, approverId) => {
  const queryText = `
    UPDATE payments
    SET 
      is_approve = 2,
      approve_by = $1
    WHERE payments_id = $2
  `;
  await pool.query(queryText, [approverId, paymentId]);
  return true;
};

const rejectPaymentsDb = async (paymentId, approverId) => {
  const queryText = `
    UPDATE payments
    SET 
      is_approve = 1,
      approve_by = $1
    WHERE payments_id = $2
  `;
  await pool.query(queryText, [approverId, paymentId]);
  return true;
};


module.exports = {
    getAllPaymentsDb,
    getPaymentsByIdDb,
    insertPaymentsDb,
    updatePaymentsDb,
    deletePaymentsDb,
    approvePaymentsDb,
    rejectPaymentsDb
};
