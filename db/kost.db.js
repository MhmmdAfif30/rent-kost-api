const pool = require("../config");

// Get all kost
const getAllKostDb = async (searchParams = {}) => {
    let queryParams = [];

    //  Pagination
    if (searchParams.limit) {
        const page = Number(searchParams.page ?? 1) - 1;
        queryParams = [Number(searchParams.limit ?? 10), page];
    }

    const { whereOrConditions, whereParamOr } = pool.buildStringOrIlike(
        ["a.nama_kost"],
        searchParams.criteria,
        queryParams
    );
    if (whereParamOr) queryParams = whereParamOr;

    const { whereConditions, whereParamAnd } = pool.buildFilterQuery(
        [
            { column: "a.nama_kost", param: searchParams.nama_kost, type: "string" },
        ],
        queryParams
    );
    if (whereParamAnd) queryParams = whereParamAnd;

    const queryText = `

    SELECT 
      COUNT(*) OVER() AS total_data, 
      a.*

    FROM room_kost a

      ${whereConditions.length > 0 ? ` AND ${whereConditions.join(" AND ")}` : ""}
      ${whereOrConditions ? ` ${whereOrConditions}` : ""}

    ORDER BY a.room_kost_id ASC
    ${searchParams.limit ? `OFFSET $2 * $1 ROWS FETCH NEXT $1 ROWS ONLY` : ''}
  `;

    const result = await pool.query(queryText, queryParams);
    const total =
        result?.recordset?.length > 0
            ? parseInt(result.recordset[0].total_data, 10)
            : 0;

    return { data: result.recordset, total };
};


// Get kost by ID
const getKostByIdDb = async (id) => {
    const queryText = `

     SELECT 
      a.*
    FROM room_kost a

    WHERE a.room_kost_id = $1
  `;
    const result = await pool.query(queryText, [id]);
    return result.recordset[0] || null;
}


// Create kost
const createKostDb = async (data) => {
    const { query: queryText, values } = pool.buildDynamicInsert("room_kost", data);
    const result = await pool.query(queryText, values);
    const insertedId = result.insertId;
    return insertedId ? await getKostByIdDb(insertedId) : null;
};

// Update kost
const updateKostDb = async (kostId, data) => {
    const { query: queryText, values } = pool.buildDynamicUpdate("room_kost", data, {
        room_kost_id: kostId,
    });
    await pool.query(`${queryText}`, values);
    return getKostByIdDb(kostId);
};

// Delete kost
const deleteKostDb = async (kostId,) => {

    const queryText = `
    UPDATE room_kost

    SET 
      is_active = 0
      
    WHERE room_kost_id = $1
  `;
    await pool.query(queryText, [kostId]);
    return true;
};


module.exports = {
    getAllKostDb,
    getKostByIdDb,
    createKostDb,
    updateKostDb,
    deleteKostDb,
};