import * as fs from 'fs';
import * as path from 'path';

const targetName = process.argv[2];

if (!targetName) {
    console.error('Error: 请提供一个名称，例如: npm run gen user');
    process.exit(1);
}

const nameLower = targetName.toLowerCase();
const nameCapitalized = nameLower.charAt(0).toUpperCase() + nameLower.slice(1);

const entityJson = JSON.parse((fs.readFileSync(path.resolve(__dirname, "../json", nameLower + ".json"))).toString());

console.log(entityJson);

const templateDir = path.resolve(__dirname, './template');
const outputSharedDir = path.resolve(__dirname, '../modules', nameLower);
const outputServerDir = path.resolve(__dirname, '../../server/modules', nameLower);

[outputSharedDir, outputServerDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

if (!fs.existsSync(templateDir)) {
    console.error(`Error: 模板目录不存在: ${templateDir}`);
    process.exit(1);
}

// 生成基本类型与dto
const entityFields = Object.keys(entityJson.fields).map((i: string) => {
    return `${i}: ${entityJson.fields[i][0]};`
}).join(`\n    `);
const entityFile = `import { BaseEntity } from "../../lib/default/base.entity";

export interface ${nameCapitalized}Entity extends BaseEntity {
    ${entityFields}
}`
fs.writeFileSync(`./shared/modules/${nameLower}/${nameLower}.entity.ts`, entityFile)

const dtoFieldsPravite = Object.keys(entityJson.fields).map((i: string) => {
    return `private _${i}: ${entityJson.fields[i][0]} = "${entityJson.fields[i][1]}";`
}).join(`\n    `);

const dtoFieldsGetSet = Object.keys(entityJson.fields).map((i: string) => {
    return `public get ${i}(): string { return this._${i}; }\n    public get name(): string { return this._${i}; }`
}).join(`\n    `);
const dtoFile = `import { BaseDTO } from "../../lib/default/base.dto";

export class AccountDTO extends BaseDTO {
    ${dtoFieldsPravite.slice(0, -4)}

    public get name(): string { return this._name; }
    public set name(value: string) { this._name = value; }

    public get email(): string { return this._email; }
    public set email(value: string) { this._email = value; }

    public get password(): string { return this._password; }
    public set password(value: string) { this._password = value; }

    toJSON() {
        return {
            name: this._name,
            email: this._email,
        };
    }
}`

// 生成服务组件
const templates = fs.readdirSync(templateDir).filter(file => file.endsWith('.txt'));

if (templates.length === 0) {
    console.warn('Warning: 在 template 目录下没有找到任何 .txt 模板文件');
}

templates.forEach(templateFile => {
    const templatePath = path.join(templateDir, templateFile);
    let content = fs.readFileSync(templatePath, 'utf-8');

    content = content.replace(/Account/g, nameCapitalized);
    content = content.replace(/account/g, nameLower);

    const baseFileName = templateFile.replace('.txt', '');
    const outputFileName = `${nameLower}.${baseFileName}.ts`;

    const targetDir = baseFileName.includes('controller') ? outputServerDir : outputSharedDir;
    const finalPath = path.join(targetDir, outputFileName);

    try {
        fs.writeFileSync(finalPath, content);
        console.log(`Generated: ${finalPath}`);
    } catch (err) {
        console.error(`Failed to write ${finalPath}:`, err);
    }
});

console.log(`\n全部文件生成完毕！目标对象: ${nameCapitalized}`);