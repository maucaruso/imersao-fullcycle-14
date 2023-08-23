export const fetcher = async (url: string): Promise<any> => {
  const response = await fetch(url);
  const json = await response.json();
  console.log(json);
  return json;
};