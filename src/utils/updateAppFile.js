import fs from "fs-extra";
import recast from "recast";

export const updateAppFile = async (appFilePath, feature, language) => {
  if (!fs.existsSync(appFilePath)) {
    throw new Error(`App file not found at ${appFilePath}`);
  }

  const code = await fs.readFile(appFilePath, "utf-8");
  const parser = language === "typescript" 
    ? (await import("recast/parsers/typescript.js")).default 
    : (await import("recast/parsers/babel.js")).default;

  const ast = recast.parse(code, { parser });

  const importStatement = recast.parse(`import ${feature}Router from './routes/${feature}';`, {
    parser
  }).program.body[0];
  
  const middleware = recast.parse(`app.use('/${feature}', ${feature}Router);`, {
    parser
  }).program.body[0];

  let importAdded = false;
  let middlewareAdded = false;

  recast.visit(ast, {
    visitImportDeclaration(path) {
      if (path.node.source.value === `./routes/${feature}`) {
        importAdded = true;
      }
      this.traverse(path);
    },
    visitExpressionStatement(path) {
      const { expression } = path.node;
      if (
        expression.type === "CallExpression" &&
        'object' in expression.callee &&
        'property' in expression.callee &&
        'name' in expression.callee.object &&
        'name' in expression.callee.property &&
        expression.callee.object.name === "app" &&
        expression.callee.property.name === "use" &&
        expression.arguments[1] &&
        'name' in expression.arguments[1] &&
        expression.arguments[1].name === `${feature}Router`
      ) {
        middlewareAdded = true;
      }
      this.traverse(path);
    },
  });

  if (!importAdded) ast.program.body.unshift(importStatement);
  if (!middlewareAdded) ast.program.body.push(middleware);

  const updatedCode = recast.print(ast).code;
  await fs.writeFile(appFilePath, updatedCode, "utf-8");
};
