const POLL_INTERVAL_MS = 5000;

type JobType = 'send_email' | 'process_payment' | 'update_inventory';

interface Job {
  id: string;
  type: JobType;
  payload: { orderId: string };
}

function fetchNextJob(): Job | null {
  if (Math.random() > 0.6) return null;
  const types: JobType[] = ['send_email', 'process_payment', 'update_inventory'];
  return {
    id: `JOB-${Date.now()}`,
    type: types[Math.floor(Math.random() * types.length)],
    payload: { orderId: `ORD-${Math.floor(Math.random() * 9999)}` },
  };
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processJob(job: Job) {
  console.log(`Processing [${job.type}] for order ${job.payload.orderId}`);
  await sleep(300);
  console.log(`Done — ${job.id}`);
}

async function main() {
  console.log('BrightCart Worker started — polling every 5s');
  let count = 0;
  while (true) {
    try {
      const job = fetchNextJob();
      if (job) {
        await processJob(job);
        count++;
        console.log(`Total processed: ${count}`);
      } else {
        console.log('Queue empty — waiting...');
      }
    } catch (err) {
      console.error('Worker error:', err);
    }
    await sleep(POLL_INTERVAL_MS);
  }
}

main();