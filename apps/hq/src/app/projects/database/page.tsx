import { redirect } from "next/navigation";

interface SearchParams {
  search?: string;
  status?: string;
  category?: string;
  domain?: string;
  sort?: string;
}

export default async function ProjectsDatabaseRoutePage(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const params = new URLSearchParams();

  if (searchParams?.search) params.set("search", searchParams.search);
  if (searchParams?.status) params.set("status", searchParams.status);
  if (searchParams?.category) params.set("category", searchParams.category);
  if (searchParams?.domain) params.set("domain", searchParams.domain);
  if (searchParams?.sort) params.set("sort", searchParams.sort);

  const query = params.toString();
  redirect(query ? `/projects?${query}` : "/projects");
}
