const pool = require("../config");

// Get all users
const getAllUsersDb = async (searchParams = {}) => {
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
      u.users_id, u.fullname, u.username, u.email, u.contact_phone,
      u.is_active, u.is_sa, u.is_approve, u.approve_by,
      approved.fullname AS approved_by_name,
      ur.role_id, ur.role_name

    FROM users u

    LEFT JOIN users_role ur ON u.role_id = ur.role_id

    LEFT JOIN users approved ON u.approve_by = approved.users_id
    ${whereClause}
    ORDER BY u.users_id ASC
    ${paginationClause}
  `;

  const result = await pool.query(queryText, queryParams);

  const total =
    result?.recordset && result.recordset.length > 0
      ? parseInt(result.recordset[0].total_data, 10)
      : 0;

  return { data: result.recordset, total };
};

// Get user by ID
const getUserByIdDb = async (id) => {
  const queryText = `

    SELECT 
      u.users_id, u.fullname, u.username, u.email, u.contact_phone,
      u.is_active, u.is_sa, u.is_approve,
      approved.fullname AS approved_by_name,
      ur.role_id, ur.role_name

    FROM users u

    LEFT JOIN users_role ur ON u.role_id = ur.role_id

    LEFT JOIN users approved ON u.approve_by = approve.users_id

    WHERE u.users_id = $1
  `;
  const result = await pool.query(queryText, [id]);
  return result.recordset[0] || null;
};

// Get user by email
const getUserByUserEmailDb = async (email) => {
  const queryText = `

    SELECT 
      u.users_id, u.fullname, u.username, u.email, u.contact_phone,
      u.password, u.is_active, u.is_sa, u.is_approve, u.role_id,
      ur.role_name

    FROM users u

    LEFT JOIN users_role ur ON u.role_id = ur.role_id

    WHERE u.email = $1
  `;
  const result = await pool.query(queryText, [email]);
  return result.recordset[0] || null;
};

// Get user by username
const getUserByUsernameDb = async (username) => {
  const queryText = `

    SELECT 
      u.users_id, u.fullname, u.username, u.email, u.contact_phone,
      u.password, u.is_active, u.is_sa, u.is_approve, u.role_id,
      ur.role_name

    FROM users u

    LEFT JOIN users_role ur ON u.role_id = ur.role_id

    WHERE u.username = $1
  `;
  const result = await pool.query(queryText, [username]);
  return result.recordset[0] || null;
};

// Create user
const createUserDb = async (data) => {
  const { query: queryText, values } = pool.buildDynamicInsert("users", data);
  const result = await pool.query(queryText, values);
  const insertedId = result.insertId;
  return insertedId ? await getUserByIdDb(insertedId) : null;
};

// Update user
const updateUserDb = async (userId, data) => {
  const { query: queryText, values } = pool.buildDynamicUpdate("users", data, {
    users_id: userId,
  });
  await pool.query(`${queryText}`, values);
  return getUserByIdDb(userId);
};

// Approve user
const approveUserDb = async (userId, approverId) => {
  const queryText = `
    UPDATE users

    SET 
      is_approve = 2,
      approve_by = $1

    WHERE users_id = $2
  `;
  await pool.query(queryText, [approverId, userId]);
  return true;
};

// Reject user
const rejectUserDb = async (userId, approverId) => {
  const queryText = `
    UPDATE users

    SET 
      is_approve = 0,
      approve_by = $1

    WHERE users_id = $2
  `;
  await pool.query(queryText, [approverId, userId]);
  return true;
};

// Delete user
const deleteUserDb = async (userId, deletedBy) => {
  const queryText = `
    UPDATE users

    SET 
      deleted_by = $1,
      is_active = 0
      
    WHERE users_id = $2 
  `;
  await pool.query(queryText, [deletedBy, userId]);
  return true;
};

module.exports = {
  getAllUsersDb,
  getUserByIdDb,
  getUserByUserEmailDb,
  getUserByUsernameDb,
  createUserDb,
  updateUserDb,
  approveUserDb,
  rejectUserDb,
  deleteUserDb,
};