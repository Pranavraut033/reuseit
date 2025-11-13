// #!/usr/bin/env node

// const fs = require('fs');
// const path = require('path');

// const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);

// const moduleName = process.argv[2];
// if (!moduleName) {
//   console.error('Usage: node generate-nest-resource.js <moduleName>');
//   process.exit(1);
// }
// const ModelName = capitalize(moduleName);

// const moduleDir = path.join('src', 'modules', moduleName);

// if (!fs.existsSync(moduleDir)) {
//   fs.mkdirSync(moduleDir, { recursive: true });
// }

// const files = [
//   {
//     name: `${moduleName}.module.ts`,
//     content: `
// import { Module } from '@nestjs/common';
// import { ${ModelName}Service } from './${moduleName}.service';
// import { ${ModelName}Resolver } from './${moduleName}.resolver';

// @Module({
//   providers: [${ModelName}Service, ${ModelName}Resolver],
//   exports: [${ModelName}Service],
// })
// export class ${ModelName}Module {}
// `.trim()
//   },
//   {
//     name: `${moduleName}.service.ts`,
//     content: `
// import { Injectable } from '@nestjs/common';
// import { PrismaService } from '../../prisma/prisma.service';
// import { ${ModelName} as Prisma${ModelName} } from '@prisma/client';

// @Injectable()
// export class ${ModelName}Service {
//   constructor(private readonly prisma: PrismaService) {}

//   async findAll(): Promise<Prisma${ModelName}[]> {
//     return this.prisma.${lower(moduleName)}.findMany();
//   }

//   async findById(id: string): Promise<Prisma${ModelName} | null> {
//     return this.prisma.${lower(moduleName)}.findUnique({ where: { id } });
//   }

//   // Add other CRUD methods as needed
// }
// `.trim()
//   },
//   {
//     name: `${moduleName}.resolver.ts`,
//     content: `
// import { Resolver, Query, Args } from '@nestjs/graphql';
// import { ${ModelName}Service } from './${moduleName}.service';
// import { ${ModelName} } from './${moduleName}.model';

// @Resolver(() => ${ModelName})
// export class ${ModelName}Resolver {
//   constructor(private readonly ${lower(moduleName)}Service: ${ModelName}Service) {}

//   @Query(() => [${ModelName}])
//   async ${moduleName}s() {
//     return this.${lower(moduleName)}Service.findAll();
//   }

//   @Query(() => ${ModelName}, { nullable: true })
//   async ${moduleName}(@Args('id') id: string) {
//     return this.${lower(moduleName)}Service.findById(id);
//   }
// }
// `.trim()
//   },
//   {
//     name: `${moduleName}.model.ts`,
//     content: `
// import { ObjectType, Field, ID } from '@nestjs/graphql';

// @ObjectType()
// export class ${ModelName} {
//   @Field(() => ID)
//   id: string;

//   // Add more fields as per your Prisma schema
// }
// `.trim()
//   }
// ];

// for (const file of files) {
//   fs.writeFileSync(path.join(moduleDir, file.name), file.content);
//   console.log('Created: ', path.join(moduleDir, file.name));
// }

// generate-nest-resource.js
// Run with: node generate-nest-resource.js

const fs = require('fs');
const path = require('path');

const prismaFile = path.join(__dirname, 'prisma', 'schema.prisma');
const modulesDir = path.join(__dirname, 'src', 'modules');

// Utility: parse Prisma file for model blocks
function parsePrismaModels(schema) {
  const models = {};
  const lines = schema.split('\n');
  let inModel = false;
  let modelName = '';
  let fields = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('model ')) {
      inModel = true;
      modelName = trimmed.split(' ')[1];
      fields = [];
    } else if (inModel && trimmed === '}') {
      models[modelName] = fields.slice();
      inModel = false;
    } else if (inModel && trimmed && !trimmed.startsWith('//')) {
      const [name, type, ...attrs] = trimmed.split(/\s+/);
      if (!name || !type) continue;
      fields.push({ name, type });
    }
  }
  return models;
}

// Basic Prisma → GraphQL/TS type mapping
function prismaToGraphQL(type) {
  if (type.endsWith('[]')) return '[String]';
  if (['String'].includes(type)) return 'String';
  if (['Int'].includes(type)) return 'Int';
  if (['Float', 'Decimal'].includes(type)) return 'Float';
  if (['DateTime'].includes(type)) return 'Date';
  if (['Boolean'].includes(type)) return 'Boolean';
  if (['Json'].includes(type)) return 'GraphQLJSON';
  if (type === 'ID') return 'ID';
  return type;
}
function prismaToTSType(type) {
  if (type.endsWith('[]')) return 'string[]';
  if (type === 'String') return 'string';
  if (type === 'Int') return 'number';
  if (type === 'Boolean') return 'boolean';
  if (type === 'Float' || type === 'Decimal') return 'number';
  if (type === 'DateTime') return 'Date';
  if (type === 'Json') return 'any';
  return type;
}

// Create model file
function createModelFile(modelName, fields) {
  const lines = [];
  lines.push(`import { ObjectType, Field, ID } from '@nestjs/graphql';`);
  lines.push('');
  lines.push('@ObjectType()');
  lines.push(`export class ${modelName} {`);
  fields.forEach(f => {
    let tsType = prismaToTSType(f.type);
    let gqlType = prismaToGraphQL(f.type);
    if (f.name === 'id' || f.type === 'ID') {
      lines.push(`  @Field(() => ID)`);
    } else {
      lines.push(`  @Field(${gqlType !== 'String' ? `() => ${gqlType}` : ''})`);
    }
    lines.push(`  ${f.name}: ${tsType};`);
    lines.push('');
  });
  lines.push('}');
  return lines.join('\n');
}

// Create service file
function createServiceFile(modelName) {
  const lcModel = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  return `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ${modelName} as Prisma${modelName} } from '@prisma/client';

@Injectable()
export class ${modelName}Service {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Prisma${modelName}[]> {
    return this.prisma.${lcModel}.findMany();
  }

  async findById(id: string): Promise<Prisma${modelName} | null> {
    return this.prisma.${lcModel}.findUnique({ where: { id } });
  }

  // TODO: add more CRUD methods as needed
}
`;
}

// Create resolver file
function createResolverFile(modelName) {
  const lcModel = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  return `import { Resolver, Query, Args } from '@nestjs/graphql';
import { ${modelName}Service } from './${lcModel}.service';
import { ${modelName} } from './${lcModel}.model';

@Resolver(() => ${modelName})
export class ${modelName}Resolver {
  constructor(private readonly ${lcModel}Service: ${modelName}Service) {}

  @Query(() => [${modelName}])
  async ${lcModel}s() {
    return this.${lcModel}Service.findAll();
  }

  @Query(() => ${modelName}, { nullable: true })
  async ${lcModel}(@Args('id') id: string) {
    return this.${lcModel}Service.findById(id);
  }

  // TODO: add mutations for CRUD
}
`;
}

// Create module file
function createModuleFile(modelName) {
  const lcModel = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  return `import { Module } from '@nestjs/common';
import { ${modelName}Service } from './${lcModel}.service';
import { ${modelName}Resolver } from './${lcModel}.resolver';

@Module({
  providers: [${modelName}Service, ${modelName}Resolver],
  exports: [${modelName}Service],
})
export class ${modelName}Module {}
`;
}

// === Script main logic ===
const raw = fs.readFileSync(prismaFile, 'utf-8');
const models = parsePrismaModels(raw);

if (!fs.existsSync(modulesDir)) fs.mkdirSync(modulesDir, { recursive: true });

Object.entries(models).forEach(([model, fields]) => {
  const lc = model.charAt(0).toLowerCase() + model.slice(1);
  const dir = path.join(modulesDir, lc);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, `${lc}.model.ts`), createModelFile(model, fields));
  fs.writeFileSync(path.join(dir, `${lc}.service.ts`), createServiceFile(model));
  fs.writeFileSync(path.join(dir, `${lc}.resolver.ts`), createResolverFile(model));
  fs.writeFileSync(path.join(dir, `${lc}.module.ts`), createModuleFile(model));
  console.log(`Generated module for ${model}`);
});

console.log('\nAll resource files generated!');