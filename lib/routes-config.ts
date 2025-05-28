// for page navigation & to sort on leftbar

export type EachRoute = {
  title: string;
  href: string;
  noLink?: true; // noLink will create a route segment (section) but cannot be navigated
  items?: EachRoute[];
  tag?: string;
};

export const ROUTES: EachRoute[] = [
  {
    title: "Getting Started",
    href: "/getting-started",
    noLink: true,
    items: [
      { title: "Areas", href: "/areas" },
      
      {
        title: "Books",
        href: "/books",
      },
      { title: "Cash Flow", href: "/cash-flow" },
      { title: "Dashboard", href: "/dashboard" },
      { title: "Debts", href: "/debts" },
      { title: "Guide", href: "/guide" },
      { title: "Habits", href: "/habits" },
      { title: "How does it work?", href: "/working" },
      { title: "Investments", href: "/investments" },
      { title: "More", href: "/more" },
      { title: "Project Structure", href: "/project-structure" },
      { title: "Notes & Web Clips", href: "/notes-webclips" },
      { title: "Recipes", href: "/recipes" },
      
      { title: "Tasks, Projects & Goals", href: "/tasks-projects-goals" },
      { title: "Travel", href: "/travel" },
      { title: "What is Seribro", href: "/seribro" },
      { title: "Wins", href: "/wins" },
    ],
  },
];

type Page = { title: string; href: string };

function getRecurrsiveAllLinks(node: EachRoute) {
  const ans: Page[] = [];
  if (!node.noLink) {
    ans.push({ title: node.title, href: node.href });
  }
  node.items?.forEach((subNode) => {
    const temp = { ...subNode, href: `${node.href}${subNode.href}` };
    ans.push(...getRecurrsiveAllLinks(temp));
  });
  return ans;
}

export const page_routes = ROUTES.map((it) => getRecurrsiveAllLinks(it)).flat();
