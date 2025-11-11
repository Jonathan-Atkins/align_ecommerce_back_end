import app from './app';

const port = process.env.PORT || 4000;

app.listen(Number(port), () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${port}`);
});
