// Static curricula for the Core CS subjects. Keep topic lists short but
// representative — the AI generates fresh questions/answers per topic.
export type CoreCsSubject = "dbms" | "os" | "cn" | "oop";

export type CoreCsTopic = {
  slug: string;
  name: string;
  summary: string;
};

export type CoreCsSubjectMeta = {
  slug: CoreCsSubject;
  name: string;
  areaTopic: "DBMS" | "OS" | "CN" | "OOP";
  tagline: string;
  topics: CoreCsTopic[];
};

export const CORE_CS_SUBJECTS: CoreCsSubjectMeta[] = [
  {
    slug: "dbms",
    name: "DBMS",
    areaTopic: "DBMS",
    tagline: "Database design, normalization, transactions and query internals.",
    topics: [
      { slug: "er-model", name: "ER Model & Schema Design", summary: "Entities, relationships, keys and mapping ER diagrams to tables." },
      { slug: "normalization", name: "Normalization", summary: "1NF–BCNF, functional dependencies and decomposition." },
      { slug: "sql-fundamentals", name: "SQL Fundamentals", summary: "Joins, aggregation, subqueries and set operations." },
      { slug: "transactions", name: "Transactions & ACID", summary: "ACID properties, schedules, serializability." },
      { slug: "concurrency-control", name: "Concurrency Control", summary: "Locking, timestamp ordering, deadlocks." },
      { slug: "indexing", name: "Indexing & Storage", summary: "B+ trees, hashing, clustered vs non-clustered indexes." },
      { slug: "er-vs-nosql", name: "SQL vs NoSQL", summary: "When to use relational vs document/key-value stores." },
    ],
  },
  {
    slug: "os",
    name: "Operating Systems",
    areaTopic: "OS",
    tagline: "Processes, memory, scheduling and concurrency.",
    topics: [
      { slug: "process-thread", name: "Processes & Threads", summary: "Process states, PCB, context switching, multithreading." },
      { slug: "scheduling", name: "CPU Scheduling", summary: "FCFS, SJF, Round Robin, priority scheduling." },
      { slug: "synchronization", name: "Synchronization", summary: "Race conditions, mutexes, semaphores, monitors." },
      { slug: "deadlocks", name: "Deadlocks", summary: "Conditions for deadlock, prevention, avoidance, detection." },
      { slug: "memory-management", name: "Memory Management", summary: "Paging, segmentation, virtual memory, page replacement." },
      { slug: "file-systems", name: "File Systems", summary: "File allocation, directories, disk scheduling." },
    ],
  },
  {
    slug: "cn",
    name: "Computer Networks",
    areaTopic: "CN",
    tagline: "OSI/TCP-IP layers, routing, protocols and the web stack.",
    topics: [
      { slug: "osi-tcpip", name: "OSI & TCP/IP Models", summary: "Layers, encapsulation and responsibilities of each layer." },
      { slug: "tcp-udp", name: "TCP vs UDP", summary: "Reliability, handshakes, flow and congestion control." },
      { slug: "ip-routing", name: "IP Addressing & Routing", summary: "Subnetting, NAT, routing protocols basics." },
      { slug: "http-dns", name: "HTTP, DNS & the Web", summary: "Request/response cycle, DNS resolution, HTTPS/TLS." },
      { slug: "switching", name: "Switching & LAN", summary: "Circuit vs packet switching, Ethernet, ARP." },
    ],
  },
  {
    slug: "oop",
    name: "OOP",
    areaTopic: "OOP",
    tagline: "Object-oriented fundamentals and design principles.",
    topics: [
      { slug: "pillars", name: "Four Pillars", summary: "Encapsulation, abstraction, inheritance, polymorphism." },
      { slug: "solid", name: "SOLID Principles", summary: "Single responsibility through Dependency inversion, with examples." },
      { slug: "design-patterns", name: "Common Design Patterns", summary: "Singleton, factory, observer, strategy." },
      { slug: "polymorphism-deep", name: "Polymorphism & Overloading", summary: "Compile-time vs runtime polymorphism, virtual functions." },
      { slug: "association", name: "Association, Aggregation, Composition", summary: "Relationships between classes and object lifetimes." },
    ],
  },
];

export function subjectBySlug(slug: string) {
  return CORE_CS_SUBJECTS.find((s) => s.slug === slug) ?? null;
}

export function topicBySlug(subjectSlug: string, topicSlug: string) {
  const subject = subjectBySlug(subjectSlug);
  const topic = subject?.topics.find((t) => t.slug === topicSlug) ?? null;
  return { subject, topic };
}
