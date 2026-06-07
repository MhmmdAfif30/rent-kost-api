const pool = require("../config");

const getAllRolesDb = async (searchParams = {}) => {
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

    FROM users_role a

    WHERE a.deleted_at IS NULL
      ${whereConditions.length > 0 ? ` AND ${whereConditions.join(" AND ")}` : ""}
      ${whereOrConditions ? ` ${whereOrConditions}` : ""}

    ORDER BY a.role_id ASC
    ${searchParams.limit ? `OFFSET $2 * $1 ROWS FETCH NEXT $1 ROWS ONLY` : ''}
  `;

    const result = await pool.query(queryText, queryParams);
    const total =
        result?.recordset?.length > 0
            ? parseInt(result.recordset[0].total_data, 10)
            : 0;

    return { data: result.recordset, total };
};

const getRolesByIdDb = async (id) => {
    const queryText = `

    SELECT 
      a.*
    FROM users_role a

    WHERE a.role_id = $1 AND a.deleted_at IS NULL
  `;
    const result = await pool.query(queryText, [id]);
    return result.recordset?.[0] || null;
};

const insertRolesDb = async (store) => {
    const { query: queryText, values } = pool.buildDynamicInsert("users_role", store);
    const result = await pool.query(queryText, values);
    const insertedId = result.recordset?.[0]?.inserted_id;

    return insertedId ? await getRolesByIdDb(insertedId) : null;
};

const updateRolesDb = async (id, data) => {
    const store = { ...data };
    const whereData = { role_id: id };

    const { query: queryText, values } = pool.buildDynamicUpdate(
        "users_role",
        store,
        whereData
    );

    await pool.query(`${queryText}`, values);
    return getRolesByIdDb(id);
};

const deleteRolesDb = async (id, deletedBy) => {
    const queryText = `
    UPDATE users_role
    WHERE role_id = $2 
  `;
    await pool.query(queryText, [deletedBy, id]);
    return true;
};

module.exports = {
    getAllRolesDb,
    getRolesByIdDb,
    insertRolesDb,
    updateRolesDb,
    deleteRolesDb,
};
