export type SqlSchema = {
  id: string;
  name: string;
  description: string;
  setupSql: string;
};

export const SQL_SCHEMAS: SqlSchema[] = [
  {
    id: "hr",
    name: "Employees & Departments",
    description: "A simple HR schema with employees and their departments.",
    setupSql: `
      CREATE TABLE departments (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL
      );
      CREATE TABLE employees (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        department_id INTEGER,
        salary INTEGER NOT NULL,
        manager_id INTEGER,
        FOREIGN KEY (department_id) REFERENCES departments(id)
      );
      INSERT INTO departments VALUES
        (1, 'Engineering'), (2, 'Sales'), (3, 'HR');
      INSERT INTO employees VALUES
        (1, 'Alice', 1, 95000, NULL),
        (2, 'Bob', 1, 85000, 1),
        (3, 'Carol', 1, 78000, 1),
        (4, 'Dave', 2, 65000, NULL),
        (5, 'Eve', 2, 72000, 4),
        (6, 'Frank', 3, 55000, NULL),
        (7, 'Grace', NULL, 60000, NULL);
    `,
  },
  {
    id: "shop",
    name: "Customers, Orders & Products",
    description: "A small e-commerce schema for joins and aggregation practice.",
    setupSql: `
      CREATE TABLE customers (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        city TEXT NOT NULL
      );
      CREATE TABLE products (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        price INTEGER NOT NULL
      );
      CREATE TABLE orders (
        id INTEGER PRIMARY KEY,
        customer_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        order_date TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      );
      INSERT INTO customers VALUES
        (1, 'Nina', 'Pune'), (2, 'Omar', 'Delhi'), (3, 'Priya', 'Pune'), (4, 'Sam', 'Mumbai');
      INSERT INTO products VALUES
        (1, 'Keyboard', 1200), (2, 'Mouse', 500), (3, 'Monitor', 9000), (4, 'Laptop Stand', 800);
      INSERT INTO orders VALUES
        (1, 1, 1, 2, '2024-01-05'),
        (2, 1, 2, 1, '2024-01-05'),
        (3, 2, 3, 1, '2024-01-10'),
        (4, 3, 2, 3, '2024-02-01'),
        (5, 4, 4, 1, '2024-02-15'),
        (6, 3, 3, 1, '2024-03-01'),
        (7, 2, 1, 1, '2024-03-05');
    `,
  },
];

export type SqlQuestion = {
  id: string;
  schemaId: string | null; // null for concept-only questions
  subtopic:
    | "SELECT"
    | "JOIN"
    | "GROUP BY"
    | "HAVING"
    | "Subqueries"
    | "CTEs"
    | "Window Functions"
    | "Constraints"
    | "Normalization";
  difficulty: "Easy" | "Medium" | "Hard";
  title: string;
  prompt: string;
  expectedSql?: string; // reference query to compute the expected result against the same schema
};

export const SQL_QUESTIONS: SqlQuestion[] = [
  {
    id: "select-basic",
    schemaId: "hr",
    subtopic: "SELECT",
    difficulty: "Easy",
    title: "List all employees earning more than 70000",
    prompt: "Write a query that selects `name` and `salary` for employees earning more than 70000, ordered by salary descending.",
    expectedSql: "SELECT name, salary FROM employees WHERE salary > 70000 ORDER BY salary DESC;",
  },
  {
    id: "select-distinct",
    schemaId: "shop",
    subtopic: "SELECT",
    difficulty: "Easy",
    title: "List distinct cities customers live in",
    prompt: "Write a query that returns the distinct list of cities from the customers table.",
    expectedSql: "SELECT DISTINCT city FROM customers;",
  },
  {
    id: "join-basic",
    schemaId: "hr",
    subtopic: "JOIN",
    difficulty: "Easy",
    title: "Employee names with department names",
    prompt: "Write a query that returns each employee's name along with their department name (use a JOIN). Include employees without a department using a LEFT JOIN.",
    expectedSql:
      "SELECT e.name, d.name AS department FROM employees e LEFT JOIN departments d ON e.department_id = d.id;",
  },
  {
    id: "join-shop",
    schemaId: "shop",
    subtopic: "JOIN",
    difficulty: "Medium",
    title: "Order details with customer and product names",
    prompt: "Write a query that lists order id, customer name, product name and quantity for every order.",
    expectedSql:
      "SELECT o.id, c.name AS customer, p.name AS product, o.quantity FROM orders o JOIN customers c ON o.customer_id = c.id JOIN products p ON o.product_id = p.id;",
  },
  {
    id: "self-join",
    schemaId: "hr",
    subtopic: "JOIN",
    difficulty: "Medium",
    title: "Employees with their manager's name",
    prompt: "Write a query using a self-join that returns each employee's name and their manager's name (NULL if no manager).",
    expectedSql:
      "SELECT e.name AS employee, m.name AS manager FROM employees e LEFT JOIN employees m ON e.manager_id = m.id;",
  },
  {
    id: "groupby-basic",
    schemaId: "hr",
    subtopic: "GROUP BY",
    difficulty: "Easy",
    title: "Total salary per department",
    prompt: "Write a query that returns department_id and the sum of salaries for each department.",
    expectedSql: "SELECT department_id, SUM(salary) AS total_salary FROM employees GROUP BY department_id;",
  },
  {
    id: "groupby-shop",
    schemaId: "shop",
    subtopic: "GROUP BY",
    difficulty: "Medium",
    title: "Total quantity ordered per product",
    prompt: "Write a query that returns product_id and total quantity ordered across all orders, grouped by product.",
    expectedSql: "SELECT product_id, SUM(quantity) AS total_qty FROM orders GROUP BY product_id;",
  },
  {
    id: "having-basic",
    schemaId: "hr",
    subtopic: "HAVING",
    difficulty: "Medium",
    title: "Departments with average salary above 70000",
    prompt: "Write a query that returns department_id and average salary, only for departments whose average salary exceeds 70000.",
    expectedSql:
      "SELECT department_id, AVG(salary) AS avg_salary FROM employees GROUP BY department_id HAVING AVG(salary) > 70000;",
  },
  {
    id: "having-shop",
    schemaId: "shop",
    subtopic: "HAVING",
    difficulty: "Medium",
    title: "Customers with more than 1 order",
    prompt: "Write a query that returns customer_id and the count of their orders, only for customers with more than 1 order.",
    expectedSql: "SELECT customer_id, COUNT(*) AS order_count FROM orders GROUP BY customer_id HAVING COUNT(*) > 1;",
  },
  {
    id: "subquery-basic",
    schemaId: "hr",
    subtopic: "Subqueries",
    difficulty: "Medium",
    title: "Employees earning above the company average",
    prompt: "Write a query using a subquery that returns names of employees whose salary is greater than the average salary across all employees.",
    expectedSql: "SELECT name FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);",
  },
  {
    id: "subquery-shop",
    schemaId: "shop",
    subtopic: "Subqueries",
    difficulty: "Medium",
    title: "Customers who ordered the most expensive product",
    prompt: "Write a query that returns the names of customers who ordered the product with the highest price (use a subquery to find the max-price product).",
    expectedSql:
      "SELECT DISTINCT c.name FROM customers c JOIN orders o ON o.customer_id = c.id WHERE o.product_id = (SELECT id FROM products ORDER BY price DESC LIMIT 1);",
  },
  {
    id: "cte-basic",
    schemaId: "hr",
    subtopic: "CTEs",
    difficulty: "Medium",
    title: "Departments ranked by total salary using a CTE",
    prompt: "Using a WITH clause (CTE), compute total salary per department, then select only the department with the highest total.",
    expectedSql:
      "WITH dept_totals AS (SELECT department_id, SUM(salary) AS total FROM employees GROUP BY department_id) SELECT * FROM dept_totals ORDER BY total DESC LIMIT 1;",
  },
  {
    id: "cte-shop",
    schemaId: "shop",
    subtopic: "CTEs",
    difficulty: "Hard",
    title: "Top spending customer using a CTE",
    prompt: "Using a CTE, compute each customer's total spend (quantity * price summed across their orders), then return the customer with the highest total spend.",
    expectedSql:
      "WITH spend AS (SELECT o.customer_id, SUM(o.quantity * p.price) AS total FROM orders o JOIN products p ON o.product_id = p.id GROUP BY o.customer_id) SELECT c.name, s.total FROM spend s JOIN customers c ON c.id = s.customer_id ORDER BY s.total DESC LIMIT 1;",
  },
  {
    id: "window-rank",
    schemaId: "hr",
    subtopic: "Window Functions",
    difficulty: "Hard",
    title: "Rank employees by salary within department",
    prompt: "Write a query using a window function (RANK or ROW_NUMBER) that returns employee name, department_id, salary and their salary rank within their department (highest salary = rank 1).",
    expectedSql:
      "SELECT name, department_id, salary, RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rnk FROM employees;",
  },
  {
    id: "window-running-total",
    schemaId: "shop",
    subtopic: "Window Functions",
    difficulty: "Hard",
    title: "Running total of order value by date",
    prompt: "Write a query using a window function that returns each order's id, order_date, its value (quantity*price), and a running total of value ordered by order_date.",
    expectedSql:
      "SELECT o.id, o.order_date, o.quantity * p.price AS value, SUM(o.quantity * p.price) OVER (ORDER BY o.order_date, o.id) AS running_total FROM orders o JOIN products p ON o.product_id = p.id;",
  },
  {
    id: "constraints-concept",
    schemaId: null,
    subtopic: "Constraints",
    difficulty: "Easy",
    title: "Explain PRIMARY KEY vs FOREIGN KEY vs UNIQUE",
    prompt:
      "This is a concept question, not something to run. Explain in your own words the difference between PRIMARY KEY, FOREIGN KEY, and UNIQUE constraints, and give one example of when you'd use each. Type your explanation in the editor, then ask the AI to review it.",
  },
  {
    id: "normalization-concept",
    schemaId: null,
    subtopic: "Normalization",
    difficulty: "Medium",
    title: "Explain 1NF, 2NF and 3NF",
    prompt:
      "This is a concept question, not something to run. Explain what it means for a table to be in 1NF, 2NF and 3NF, with a short example of a table that violates 2NF and how you'd fix it. Type your explanation in the editor, then ask the AI to review it.",
  },
];

export function questionsBySchema(schemaId: string) {
  return SQL_QUESTIONS.filter((q) => q.schemaId === schemaId);
}
