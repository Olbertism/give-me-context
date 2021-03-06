exports.up = async (sql) => {
  await sql`
    CREATE TABLE sources (
      id integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
			title varchar(200) NOT NULL,
			url varchar(200),
			review_id integer REFERENCES reviews (id) ON DELETE CASCADE
    )
  `;
};

exports.down = async (sql) => {
  await sql`
    DROP TABLE sources
  `;
};
