import * as readline from "readline";

export function confirmOverwrite(entityType: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(`⚠️ Atenção: O pull irá APAGAR as suas ${entityType} locais e substituí-las pelo estado do servidor. Quaisquer alterações ou entidades não publicadas serão PERDIDAS. Deseja continuar? (s/N) `, answer => {
      rl.close();
      const isYes = answer.toLowerCase() === 's' || answer.toLowerCase() === 'sim' || answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
      resolve(isYes);
    });
  });
}
