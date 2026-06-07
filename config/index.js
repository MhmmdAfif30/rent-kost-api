require("dotenv").config();
const mysql = require("mysql2/promise");

const isProduction = process.env.NODE_ENV === "production";

const config = {
  host: process.env.SQL_HOST,
  user: process.env.SQL_USERNAME,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DATABASE,
  port: process.env.SQL_PORT,
  waitForConnections: true,
  queueLimit: 0
};

const pool = mysql.createPool(config);

async function checkConnection() {
  try {
    const connection = await pool.getConnection();
    connection.release();
    console.log("MySQL connection successful");
    return true;
  } catch (error) {
    console.error("MySQL connection failed:", error);
    return false;
  }
}

checkConnection();

/**
 * Wrapper query (Konversi format $1, $2 menjadi ? untuk MySQL)
 */

async function query(text, params = []) {
  const mysqlText = text.replace(/\$(\d+)/g, "?");
  const [rows] = await pool.execute(mysqlText, params);
  return { recordset: rows };
}

/**
 * Validasi tanggal
 */

// function isValidDate(dateStr) {
//   const d = new Date(dateStr);
//   return !isNaN(d.getTime());
// }

/**
 * Build filter query (AND)
 */

function buildFilterQuery(filterQuery = [], fixedParams = []) {
  let whereConditions = [];
  let queryParams = [...fixedParams];

  filterQuery.forEach((f) => {
    if (f.param === undefined || f.param === null || f.param === "") return;

    switch (f.type) {
      case "string":
        queryParams.push(`%${f.param}%`);
        whereConditions.push(`${f.column} LIKE $${queryParams.length}`);
        break;

      case "number":
        queryParams.push(f.param);
        whereConditions.push(`${f.column} = $${queryParams.length}`);
        break;

      case "boolean":
        queryParams.push(f.param ? 1 : 0);
        whereConditions.push(`${f.column} = $${queryParams.length}`);
        break;

      // case "between":
      //   if (Array.isArray(f.param) && f.param.length === 2) {
      //     const [from, to] = f.param;
      //     if (isValidDate(from) && isValidDate(to)) {
      //       queryParams.push(from);
      //       queryParams.push(to);
      //       // CAST di MySQL menggunakan DATE saja (bukan AS DATE) atau bisa langsung jika stringnya valid
      //       whereConditions.push(
      //         `DATE(${f.column}) BETWEEN $${queryParams.length - 1} AND $${queryParams.length}`
      //       );
      //     }
      //   }
      //   break;
    }
  });

  return { whereConditions, whereParamAnd: queryParams };
}

/**
 * Build OR ILIKE (MySQL pakai LIKE biasa karena default-nya sudah Case-Insensitive)
 */

function buildStringOrIlike(columnParam, criteria, fixedParams = []) {
  if (!criteria) return { whereOrConditions: "", whereParamOr: fixedParams };

  let orStringConditions = [];
  let queryParams = [...fixedParams];

  columnParam.forEach((column) => {
    if (!column) return;
    queryParams.push(`%${criteria}%`);
    orStringConditions.push(`${column} LIKE $${queryParams.length}`);
  });

  const whereClause = orStringConditions.length
    ? `AND (${orStringConditions.join(" OR ")})`
    : "";

  return { whereOrConditions: whereClause, whereParamOr: queryParams };
}

/**
 * Build Date Filter (harian / mingguan / bulanan)
 */

// function buildDateFilter(column, type, dateValue, fixedParams = []) {
//   let whereCondition = "";
//   let queryParams = [...fixedParams];

//   if (!dateValue && type !== "monthly") {
//     return { whereDateCondition: "", whereDateParams: queryParams };
//   }

//   switch (type) {
//     case "daily": {
//       queryParams.push(dateValue);
//       whereCondition = `DATE(${column}) = $${queryParams.length}`;
//       break;
//     }

//     case "weekly": {
//       const startDate = new Date(dateValue);
//       if (!isNaN(startDate.getTime())) {
//         const endDate = new Date(startDate);
//         endDate.setDate(startDate.getDate() + 6);

//         queryParams.push(startDate.toISOString().split("T")[0]);
//         queryParams.push(endDate.toISOString().split("T")[0]);

//         whereCondition = `DATE(${column}) BETWEEN $${queryParams.length - 1} AND $${queryParams.length}`;
//       }
//       break;
//     }

//     case "monthly": {
//       const [year, month] = dateValue.split("-");
//       if (year && month) {
//         queryParams.push(parseInt(year), parseInt(month));
//         whereCondition = `YEAR(${column}) = $${queryParams.length - 1} AND MONTH(${column}) = $${queryParams.length}`;
//       }
//       break;
//     }

//     default:
//       whereCondition = "";
//   }

//   return { whereDateCondition: whereCondition, whereDateParams: queryParams };
// }

/**
 * Build dynamic UPDATE
 */

function buildDynamicUpdate(table, data, where) {
  // data.updated_by = data.userId;
  // delete data.userId;

  const setParts = [];
  const values = [];
  let index = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      setParts.push(`${key} = $${index++}`);
      values.push(value);
    }
    else if (key !== undefined && key !== null) {
      setParts.push(`${key} = $${index++}`);
      values.push(value);
    }
  }

  if (setParts.length === 0) {
    throw new Error("Tidak ada kolom untuk diupdate");
  }

  // setParts.push(`updated_at = CURRENT_TIMESTAMP`);

  const whereParts = [];
  for (const [key, value] of Object.entries(where)) {
    whereParts.push(`${key} = $${index++}`);
    values.push(value);
  }

  const queryText = `
    UPDATE ${table}
    SET ${setParts.join(", ")}
    WHERE ${whereParts.join(" AND ")}
  `;

  return { query: queryText, values };
}

/**
 * Build dynamic INSERT
 */
function buildDynamicInsert(table, data) {

  // data.created_by = data.userId;
  // data.updated_by = data.userId;
  // delete data.userId;

  const columns = [];
  const placeholders = [];
  const values = [];
  let index = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      columns.push(key);
      placeholders.push(`$${index++}`);
      values.push(value);
    }
  }

  if (columns.length === 0) {
    throw new Error("Tidak ada kolom untuk diinsert");
  }

  // columns.push("created_at", "updated_at");
  // placeholders.push("CURRENT_TIMESTAMP", "CURRENT_TIMESTAMP");

  const queryText = `
    INSERT INTO ${table} (${columns.join(", ")})
    VALUES (${placeholders.join(", ")})
  `;

  return { query: queryText, values };
}

/**
 * Generate kode otomatis
 */
// async function generateKode(prefix, tableName, columnName) {
//   const result = await query(`
//     SELECT ${columnName} as kode
//     FROM ${tableName}
//     WHERE ${columnName} LIKE $1
//     ORDER BY ${columnName} DESC
//     LIMIT 1
//   `, [prefix + "%"]);

//   let nextNumber = 1;
//   if (result.recordset && result.recordset.length > 0) {
//     const lastKode = result.recordset[0].kode;
//     const lastNumber = parseInt(lastKode.replace(prefix, ""), 10);
//     nextNumber = lastNumber + 1;
//   }

//   return prefix + String(nextNumber).padStart(3, "0");
// }


module.exports = {
  checkConnection,
  query,
  buildFilterQuery,
  buildStringOrIlike,
  buildDynamicInsert,
  buildDynamicUpdate,
};