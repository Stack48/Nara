const { Project, SyntaxKind } = require('ts-morph');

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
});

const sourceFiles = project.getSourceFiles('src/app/api/**/route.ts');

for (const sourceFile of sourceFiles) {
  let modified = false;

  const functions = sourceFile.getFunctions();
  
  for (const func of functions) {
    if (func.isExported() && func.isAsync()) {
      const name = func.getName();
      if (['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(name)) {
        
        // Find catch blocks returning 500 and replace with throw error
        const catchClauses = func.getDescendantsOfKind(SyntaxKind.CatchClause);
        for (const catchClause of catchClauses) {
            const block = catchClause.getBlock();
            const blockText = block.getText();
            if (blockText.includes('status: 500') || blockText.includes('status:500')) {
                const varName = catchClause.getVariableDeclaration()?.getName() || 'error';
                block.replaceWithText(`{\n  throw ${varName};\n}`);
            }
        }

        const parameters = func.getParameters().map(p => p.getText()).join(', ');
        const bodyText = func.getBodyText();
        
        func.remove();
        
        sourceFile.addVariableStatement({
          isExported: true,
          declarations: [{
            name: name,
            initializer: `withErrorHandler(async (${parameters}) => {\n${bodyText}\n})`
          }]
        });
        modified = true;
      }
    }
  }

  if (modified) {
    const imports = sourceFile.getImportDeclarations();
    const hasImport = imports.some(i => i.getModuleSpecifierValue() === '@/lib/api-middleware');
    if (!hasImport) {
      sourceFile.addImportDeclaration({
        namedImports: ['withErrorHandler'],
        moduleSpecifier: '@/lib/api-middleware'
      });
    }
    sourceFile.saveSync();
    console.log(`Refactored ${sourceFile.getFilePath()}`);
  }
}
