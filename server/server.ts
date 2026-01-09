
import app from './app';

const PORT = 4242;

app.listen(PORT, () => {
    console.log(`\n🚀 MUZGPT Server running on port ${PORT}`);
    console.log(`Server is using shared logic from app.ts`);
});
