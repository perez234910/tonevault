import {readFileSync,writeFileSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const original=readFileSync(resolve('scripts/test-storefront.mjs'),'utf8');
const boundary='}finally{await browser.close();}';
if(original.split(boundary).length!==2)throw new Error('Unexpected matrix boundary; refusing to transform assertions.');
let complete=original.replace('const results=[];','const results=[];const failures=[];');
complete=complete.replace(boundary,'}catch(error){failures.push(error);results.push({engine,width,reduced,passed:false,error:{name:error.name,message:error.message}});console.error(`FAIL storefront ${engine} ${width}px reduced=${reduced}: ${error.message}`);}finally{await browser.close();}');
complete+='\nif(failures.length)throw new AggregateError(failures,`${failures.length} storefront case(s) failed; original assertions retained.`);\n';
// The only edits are the case boundary and aggregate reporting, after assertions throw.
const expected=original.replace('const results=[];','const results=[];const failures=[];').replace(boundary,'}catch(error){failures.push(error);results.push({engine,width,reduced,passed:false,error:{name:error.name,message:error.message}});console.error(`FAIL storefront ${engine} ${width}px reduced=${reduced}: ${error.message}`);}finally{await browser.close();}')+'\nif(failures.length)throw new AggregateError(failures,`${failures.length} storefront case(s) failed; original assertions retained.`);\n';
if(complete!==expected)throw new Error('Unexpected source change.');
const generated=join(mkdtempSync(join(tmpdir(),'tonevault-matrix-')),'complete-matrix.mjs');writeFileSync(generated,complete);
const result=spawnSync(process.execPath,[generated],{stdio:'inherit',env:process.env});
process.exitCode=result.status??1;
