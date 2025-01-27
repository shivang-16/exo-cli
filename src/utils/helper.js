import prompts from "prompts";

export const promptLanguage = async () => {
  const response = await prompts({
    type: "select",
    name: "language",
    message: "Select a language:",
    choices: [
      { title: "JavaScript", value: "javascript" },
      { title: "TypeScript", value: "typescript" },
    ],
  });

  return response.language;
};
